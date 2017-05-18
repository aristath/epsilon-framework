<?php
if ( ! defined( 'WPINC' ) ) {
	die;
}

class Epsilon_Control_Section_Area extends WP_Customize_Control {
	/**
	 * Customize control type.
	 *
	 * @access public
	 * @var string
	 */
	public $type = 'epsilon-section-area';

	/**
	 * Epsilon_Control_Section_Area constructor.
	 *
	 * @param WP_Customize_Manager $manager
	 * @param string               $id
	 * @param array                $args
	 */
	public function __construct( WP_Customize_Manager $manager, $id, array $args = array() ) {
		$manager->register_control_type( 'Epsilon_Control_Section_Area' );
		parent::__construct( $manager, $id, $args );
	}

	public function json() {
		$json = parent::json();

		return $json;
	}

	public function render_content(){

	}
}