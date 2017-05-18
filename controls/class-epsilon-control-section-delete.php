<?php
if ( ! defined( 'WPINC' ) ) {
	die;
}

class Epsilon_Control_Section_Delete extends WP_Customize_Control {
	public $section_id;
	public $section_type;
	public $index = '';
	public $type = 'epsilon-section-delete';

	public function __construct( WP_Customize_Manager $manager, $id, array $args ) {
		$manager->register_control_type( 'Epsilon_Control_Section_Delete' );
		parent::__construct( $manager, $id, $args );
	}

	/**
	 * Refreshes the parameters passed to the JavaScript via JSON.
	 *
	 */
	public function json() {
		$json                 = parent::json();
		$json['section_id']   = $this->section_id;
		$json['section_type'] = $this->section_type;
		$json['index']        = $this->index;

		return $json;
	}

	public function content_template() { ?>
        <div class="delete-container">
            <input type="hidden"
                   value='{ "type": "{{data.section_type}}", "index": "{{data.index}}", "id": "{{ data.section_id }}" }'>
            <a class="section-control-remove" href="#remove"
               title="Delete this section."><?php echo esc_html__( 'Remove', 'epsilon-framework' ); ?></a>
        </div>
	<?php }
}