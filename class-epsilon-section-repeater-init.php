<?php
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Class Epsilon_Section_Repeater
 */
class Epsilon_Section_Repeater_Init {
	/**
	 * This array is populated by the 'epsilon_section_creator' filter ( through the theme )
	 *
	 * @var array
	 */
	public $sections = array();

	/**
	 * Instance of the repeater initiator
	 *
	 * @var null
	 */
	private static $_instance = NULL;

	/**
	 * Epsilon_Section_Repeater constructor.
	 *
	 */
	public function __construct() {
		$this->sections = apply_filters( 'epsilon_section_creator', array() );

		/**
		 * Add an identifier to the sections by embedding a hidden field to the fieldset
		 */
		$this->add_identifier();

		add_action( 'customize_controls_enqueue_scripts', array( $this, 'enqueue' ), 99 );
		add_action( 'customize_register', array( $this, 'register_controls' ), 1 );
	}

	/**
	 * Embed a hidden field
	 */
	public function add_identifier() {
		foreach ( $this->sections as $section_name => $section_values ) {
			$this->sections[ $section_name ]['fields']['group'] = array(
				'title' => __( 'group', 'epsilon-framework' ),
				'type'  => 'hidden',
				'value' => $section_name,
			);

			$this->sections[ $section_name ]['fields']['identifier'] = array(
				'title' => __( 'Identifier', 'epsilon-framework' ),
				'type'  => 'hidden',
				'value' => 'epsilon-identifier-hidden-input',
			);
		}
	}

	/**
	 * Register controls ( when page is refreshed, handles all settings - static and dynamic )
	 */
	public function register_controls() {
		global $wp_customize;
		/**
		 * Add the panel and the epsilon_sections setting ( we save all data here )
		 */
		$this->_add_initial_controls( $wp_customize );
		$ordering = get_option( 'epsilon_sections_ordering', '' );

		/**
		 * We get the array of sections from the database and iterate over it
		 * It should return something like this:
		 *
		 * Array -> Section Type Array -> Sections of this type
		 * e.g.
		 * array( 'hero-type' => array('hero_1' => array(***), 'hero_2' => array(***) )
		 *
		 */
		$sections = get_option( 'epsilon_sections', array() );
		foreach ( $sections as $index => $section ) {

			/**
			 * Section id format
			 */
			$section_id = '_' . $index;

			/**
			 * Add the sections
			 */
			$wp_customize->add_section( $section_id, array(
				'title'       => $this->sections[ $section['group'] ]['title'],
				'description' => $this->sections[ $section['group'] ]['description'],
				'panel'       => 'epsilon_panel_sections',
				'priority'    => 10,
			) );

			/**
			 * Create the fields for the sections ( these are defined through epsilon_section_control filter by the theme
			 */
			foreach ( $this->sections[ $section['group'] ]['fields'] as $field_key => $field ) {

				/**
				 * Start building the ID so we can save the option through the customizer
				 */
				$id = 'epsilon_sections[' . $index . '][' . $field_key . ']';
				$this->_add_control( $field, $wp_customize, $id, $section_id, $section['group'], $index );
			}

		}
	}

	/**
	 * Add initial controls, the panel and setting in which we save data
	 *
	 * @param $manager
	 */
	public function _add_initial_controls( $manager ) {
		$manager->add_setting( 'epsilon_sections', array( 'type' => 'option' ) );
		$manager->add_control(
			new Epsilon_Control_Section_Area(
				$manager,
				'epsilon_sections',
				array(
					'section'  => 'title_tagline',
					'priority' => 999999,
				)
			)
		);

		$manager->add_panel(
			new Epsilon_Section_Repeater(
				$manager,
				'epsilon_panel_sections',
				array(
					'title'    => __( 'Sections', 'epsilon-framework' ),
					'priority' => 30,
				)
			)
		);
	}

	/**
	 * Proxy function to add the controls/settings in the sections
	 *
	 * @param $field
	 * @param $manager
	 * @param $id
	 * @param $section_id
	 * @param $type
	 * @param $index
	 */
	public function _add_control( $field, $manager, $id, $section_id, $type, $index ) {
		/**
		 * add the setting for the ID defined above
		 */
		$manager->add_setting( $id, array(
			'type' => 'option',
		) );

		/**
		 * All settings should have the delete button
		 */
		$manager->add_setting(
			'epsilon_delete_' . $section_id,
			array(
				'type' => 'option',
			)
		);

		/**
		 * Start building the controls depending on it's type
		 */
		switch ( $field['type'] ) {
			//@todo ca sa adaug epsilon controls, trebuie sa le fac pe toate cu sintaxa de backbone
			case 'epsilon-toggle':
				$manager->add_control(
					new Epsilon_Control_Toggle(
						$manager,
						$id,
						array(
							'type'     => 'epsilon-toggle',
							'label'    => $field['title'],
							'section'  => $section_id,
							'settings' => $id
						)
					)
				);
				break;
			default:
				$manager->add_control(
					$id,
					array(
						'label'    => $field['title'],
						'section'  => $section_id,
						'settings' => $id,
						'type'     => $field['type'],
					)
				);
				break;
		}

		/**
		 * Add the delete control
		 */
		$manager->add_control(
			new Epsilon_Control_Section_Delete(
				$manager,
				'epsilon_delete_' . $section_id,
				array(
					'type'         => 'epsilon-section-delete',
					'section'      => $section_id,
					'section_id'   => $section_id,
					'section_type' => $type,
					'index'        => $index
				) )
		);
	}

	/**
	 * Send the _epsilonSections object to the frontend through the localize script function
	 */
	public function enqueue() {
		wp_localize_script( 'epsilon-object', '_epsilonSections', $this->to_json() );
	}

	/**
	 * @return array
	 */
	public function to_json() {
		$epsilon_sections = array(
			'sections' => array(),
			'settings' => array(),
			'controls' => array(),
			'total'    => 0
		);

		$section_values = get_option( 'epsilon_sections', array() );

		foreach ( $this->sections as $section_id => $info ) {
			$index = count( $section_values );

			$epsilon_sections['total'] = $index;

			$epsilon_sections['sections'][ $section_id ] = array(
				'active'             => true,
				'content'            => '',
				'customizeAction'    => 'Customizing',
				'description'        => $info['description'],
				'description_hidden' => false,
				'panel'              => 'epsilon_panel_sections',
				'priority'           => 10,
				'title'              => $info['title'],
				'type'               => 'default'
			);

			$controls = array();
			$settings = array();

			foreach ( $info['fields'] as $field_key => $field ) {
				if ( ! isset( $field['description'] ) ) {
					$field['description'] = '';
				}

				$settings[ $field_key ] = array(
					'dirty'          => true,
					'transport'      => 'postMessage',
					'value'          => $field['value'],
					'type'           => 'option',
					'instanceNumber' => 1,
				);
				$controls[ $field_key ] = array(
					'active'      => true,
					'description' => $field['description'],
					'label'       => $field['title'],
					'priority'    => 1,
					'section'     => '',
					'settings'    => array( 'default' => '' ),
					'type'        => $field['type']
				);
			}

			$epsilon_sections['controls'][ $section_id ] = $controls;
			$epsilon_sections['settings'][ $section_id ] = $settings;
		}

		return $epsilon_sections;
	}

	/**
	 * We need to grab an instance to initiate parts of the script
	 *
	 * @return Epsilon_Section_Repeater_Init|null
	 */
	public static function instance() {
		if ( is_null( self::$_instance ) ) {
			self::$_instance = new self();
		}

		return self::$_instance;
	}
}