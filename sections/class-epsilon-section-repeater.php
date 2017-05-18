<?php

/**
 *
 */
class Epsilon_Section_Repeater extends WP_Customize_Panel {
	/**
	 * @var string
	 */
	public $type = 'epsilon-section-repeater';

	/**
	 * Epsilon_Section_Repeater constructor.
	 *
	 * @param WP_Customize_Manager $manager
	 * @param string               $id
	 * @param array                $args
	 */
	public function __construct( WP_Customize_Manager $manager, $id, array $args = array() ) {
		parent::__construct( $manager, $id, $args );
		$manager->register_panel_type( 'Epsilon_Section_Repeater' );

		add_action( 'customize_controls_print_footer_scripts', array(
			$this,
			'output_section_control_templates'
		), 99 );

		add_action( 'customize_controls_print_footer_scripts', array(
			$this,
			'output_customizer_control_templates'
		), 99 );

		add_filter( 'customize_dynamic_setting_args', array( $this, 'filter_customize_dynamic_setting_args' ), 10, 2 );

	}

	/**
	 * @param $args
	 * @param $setting_id
	 *
	 * @return array
	 */
	public function filter_customize_dynamic_setting_args( $args, $setting_id ) {
		$pattern = "/^epsilon_sections(?:\[(?P<section_number>\d+)\])\[(?P<input_id>.+?)\]?$/";
		if ( preg_match( $pattern, $setting_id ) ) {
			$args = $this->get_setting_args( $setting_id );
		}

		return $args;
	}

	/**
	 * @param $setting_id
	 *
	 * @return array
	 */
	public function get_setting_args( $setting_id ) {
		$args = array(
			'type'       => 'option',
			'capability' => 'edit_theme_options',
			'default'    => array(),
			'transport'  => 'postMessage',
		);

		return $args;
	}

	/**
	 * Render template
	 */
	public function render_template() { ?>
        <li id="accordion-panel-{{ data.id }}"
            class="accordion-section control-section control-panel control-panel-{{ data.type }}">
            <h3 class="accordion-section-title" tabindex="0">
                {{ data.title }}
                <span class="screen-reader-text"></span>
            </h3>
            <ul class="accordion-sub-container control-panel-content"></ul>
        </li>
		<?php
	}

	/**
	 * Content template
	 */
	protected function content_template() { //@formatter:off ?>
        <li class="panel-meta customize-info accordion-section <# if ( ! data.description ) { #> cannot-expand<# } #>">
            <button class="customize-panel-back" tabindex="-1"><span
                        class="screen-reader-text"><?php esc_html_e( 'Back' ); ?></span></button>
            <div class="accordion-section-title">
				<span class="preview-notice">
                    <?php echo sprintf( esc_html__( 'You are customizing %s', 'epsilon-framework' ), '<strong class="panel-title">{{ data.title }}</strong>' ); ?>
                </span>
                <# if ( data.description ) { #>
                    <button class="customize-help-toggle dashicons dashicons-editor-help" tabindex="0"
                            aria-expanded="false"><span class="screen-reader-text"><?php esc_html_e( 'Help', 'epsilon-framework' ); ?></span>
                    </button>
                <# } #>
            </div>
            <# if ( data.description ) { #>
                <div class="description customize-panel-description">
                    {{{ data.description }}}
                </div>
            <# } #>
            <div class="epsilon-add-section-buttons">
                <button type="button" class="button add-new-section" aria-expanded="false" aria-controls="available-sections">
                  <?php _e( 'Add a Section' ); ?>
                  </button>
                <button type="button" class="button-link reorder-toggle" aria-label="<?php esc_attr_e( 'Reorder sections', 'epsilon-framework' ); ?>">
                    <span class="reorder"><?php esc_html_e( 'Reorder', 'epsilon-framework' ); ?></span>
                    <span class="reorder-done"><?php esc_html_e( 'Done', 'epsilon-framework' ); ?></span>
                </button>
                <input type="hidden" id="epsilon-section-repeater-ordering" value="" />
                <p class="screen-reader-text"><?php esc_html_e( 'When in reorder mode, additional controls to reorder sections will be available in the sections list above.', 'epsilon-framework' ); ?></p>
            </div>
        </li>
		<?php //@formatter:on
	}

	/**
	 *
	 */
	public function output_section_control_templates() {
		$instance = Epsilon_Section_Repeater_Init::instance();
		$sections = $instance->sections;
		?>
        <div id="sections-left">
            <div id="available-sections">
                <div class="customize-section-title">
                    <h3>
					<span class="customize-action"><?php
						?></span>
						<?php esc_html_e( 'Add a Section', 'epsilon-framework' ); ?>
                    </h3>
                </div>
                <div id="available-sections-filter">
                    <h2><?php esc_html_e( 'Epsilon Sections', 'epsilon-framework' ); ?></h2>
                </div>
                <div id="available-sections-list">
					<?php foreach ( $sections as $section_id => $section ): ?>
                        <div class="epsilon-section" data-id="<?php echo $section_id ?>">
                            <span class="epsilon-section-title"><?php echo $section['title'] ?></span>
                            <span class="epsilon-section-description"><?php echo $section['description'] ?></span>
                        </div>
					<?php endforeach; ?>
                </div><!-- #available-sections-list -->
            </div><!-- #available-sections -->
        </div><!-- #sections-left -->
		<?php
	}

	/**
	 *
	 */
	public function output_customizer_control_templates() { ?>
		<?php //@formatter:off ?>
        <script type="text/html" id="tmpl-customize-control-default-content">
            <li id="{{ data.id }}" class="{{ data.class }}">
                <# if ( data.type == 'checkbox' ){ #>
                    <label>
                        <input type="checkbox" value="{{ data.value }}" data-customize-setting-link="{{ data.id }}" />
                        {{ data.label }}
                        <# if ( data.description != '' ){ #>
                            <span class="description customize-control-description">{{ data.description }}</span>
                        <# } #>
                    </label>
                <# } #>
                <# if ( data.type == 'text' ){ #>
                    <label>
                    <# if ( data.label != '' ){ #>
                        <span class="customize-control-title">{{ data.label }}</span>
                    <# } #>
                    <# if ( data.description != '' ){ #>
                        <span class="description customize-control-description">{{ data.description }}</span>
                    <# } #>
                        <input type="text" value="{{ data.value }}" data-customize-setting-link="{{ data.id }}" />
                    </label>
                <# } #>
                <# if ( data.type == 'hidden' ){ #>
                     <label>
                    <input type="hidden" value="{{ data.value }}" data-customize-setting-link="{{ data.id }}" />
                     </label>
                <# } #>
                <# if ( data.type == 'textarea' ){ #>
                    <label>
                    <# if ( data.label != '' ){ #>
                        <span class="customize-control-title">{{ data.label }}</span>
                    <# } #>
                    <# if ( data.description != '' ){ #>
                        <span class="description customize-control-description">{{ data.description }}</span>
                    <# } #>
                     <textarea rows="5" data-customize-setting-link="{{ data.id }}">{{ data.value }}</textarea>
                    </label>
                <# } #>
            </li>
        </script>
		<?php //@formatter:on
	}
}