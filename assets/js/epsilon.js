/**
 * File epsilon.js.
 *
 *
 * Epsilon Framework
 */

(function ($) {
	var EpsilonFramework = {};

	EpsilonFramework.rangeSliders = function (selector) {
		var context = $(selector),
				sliders = context.find('.slider-container'),
				slider, input, input_id, id, min, max, step;

		$.each(sliders, function () {
			var slider = $(this).find('.ss-slider'),
					input = $(this).find('.rl-slider'),
					input_id = input.attr('id'),
					id = slider.attr('id'),
					min = $('#' + id).attr('data-attr-min'),
					max = $('#' + id).attr('data-attr-max'),
					step = $('#' + id).attr('data-attr-step');

			$('#' + id).slider({
				value: $('#' + input_id).attr('value'),
				range: 'min',
				min  : parseFloat(min),
				max  : parseFloat(max),
				step : parseFloat(step),
				slide: function (event, ui) {
					$('#' + input_id).attr('value', ui.value).change();
				}
			});

			$(input).on('focus', function () {
				$(this).blur();
			});

			$('#' + input_id).attr('value', ($('#' + id).slider("value")));
			$('#' + input_id).change(function () {
				$('#' + id).slider({
					value: $(this).val()
				});
			});
		});
	};

	EpsilonFramework.typography = {
		/**
		 * Selectize instance
		 */
		_selectize: null,

		/**
		 * K/V Pair
		 */
		_linkedFonts: {},

		/**
		 * Initiate function
		 * @private
		 */
		_init: function () {
			var selector = $('.epsilon-typography-container');

			if ( selector.length ) {
				var self = this,
						numbers = $('.epsilon-number-field');

				$.each(selector, function () {
					var container = $(this),
							uniqueId = container.attr('data-unique-id'),
							selects = container.find('select'),
							inputs = container.find('.epsilon-typography-input');

					/**
					 * Instantiate the selectize javascript plugin
					 * and the input type number
					 */
					try {
						self._selectize = selects.selectize();

						$.each(selects, function () {
							self._linkedFonts[ $(selects[ 0 ]).attr('id') ] = $(selects[ 1 ]).attr('id');
						});

					}
					catch ( err ) {
						/**
						 * In case the selectize plugin is not loaded, raise an error
						 */
						console.warn('selectize not yet loaded');
					}
					/**
					 * On triggering the change event, create a json with the values and send it to the preview window
					 */
					inputs.on('change', function () {
						var val = EpsilonFramework.typography._parseJson(inputs, uniqueId);
						$('#hidden_input_' + uniqueId).val(val).trigger('change');
					});
				});

				$.each(numbers, function () {
					EpsilonFramework.typography._number($(this));
				});
				/**
				 * Add/subtract from the input type number fields
				 */
				$('.incrementor').on('click', function (e) {
					e.preventDefault();
					EpsilonFramework.typography._calcValue($(this));
				});

				/**
				 * Don't allow a value smaller than 0 in number fields
				 */
				numbers.find('input').on('change', function () {
					if ( $(this).val() < 0 ) {
						$(this).val(0).trigger('change');
					}
				});

				$.each(self._linkedFonts, function ($id, $target) {
					$('#' + $id).on('change', function () {
						if ( $(this).val() === 'Select font' || $(this).val() === 'default_font' ) {
							EpsilonFramework.typography._setSelects($(this).val(), $target, true);
						}

						EpsilonFramework.typography._setSelects($(this).val(), $target, false);
					});
				});

				/**
				 * Reset button
				 */
				$('.epsilon-typography-default').on('click', function (e) {
					e.preventDefault();
					var element = $(this);
					EpsilonFramework.typography._resetDefault(element);
				});
			}
		},

		/**
		 *
		 * @param value
		 * @param target
		 * @param reset
		 * @private
		 */
		_setSelects: function (value, target, reset) {
			var data = {
						'action': 'epsilon_retrieve_font_weights',
						'class' : 'Epsilon_Typography',
						'args'  : value
					},
					selectize = $('#' + target),
					instance = selectize[ 0 ].selectize;

			if ( reset ) {
				instance.clear();
				instance.clearOptions();
				instance.load(function (callback) {
					var obj = { 'text': 'Theme default', 'value': 'initial' };
					callback(obj);
				});
				instance.setValue('initial');

				return;
			}

			jQuery.ajax({
				dataType: 'json',
				type    : 'POST',
				url     : WPUrls.ajaxurl,
				data    : data,
				complete: function (json) {
					var json = $.parseJSON(json.responseText);
					instance.clear();
					instance.clearOptions();
					instance.load(function (callback) {
						callback(json);
					});
					instance.setValue('initial');
				}
			});
		},

		/**
		 * Reset defaults
		 *
		 * @param element
		 * @private
		 */
		_resetDefault: function (element) {
			var container = $(element).parent(),
					uniqueId = container.attr('data-unique-id'),
					selects = container.find('select'),
					inputs = container.find('inputs');

			var fontFamily = selects[ 0 ].selectize,
					fontWeight = selects[ 1 ].selectize,
					fontStyle = selects[ 2 ].selectize;

			var object = {
						action: 'epsilon_generate_typography_css',
						class : 'Epsilon_Typography',
						id    : uniqueId,
						data  : {
							'selectors': $('#selectors_' + uniqueId).val(),
							'json'     : {}
						}
					},
					api = wp.customize;

			fontFamily.setValue('default_font');
			fontStyle.setValue('initial');

			if ( $('#' + uniqueId + '-font-size').length ) {
				$('#' + uniqueId + '-font-size').val('15').trigger('blur');
				object.data.json[ 'font-size' ] = '15';
			}

			if ( $('#' + uniqueId + '-line-height').length ) {
				$('#' + uniqueId + '-line-height').val('22').trigger('change').trigger('blur');
				object.data.json[ 'line-height' ] = '22';
			}

			object.data.json[ 'font-family' ] = 'default_font';
			object.data.json[ 'font-weight' ] = 'initial';
			object.data.json[ 'font-style' ] = 'initial';

			api.previewer.send('update-inline-css', object);
		},

		/**
		 * parse/create the json and send it to the preview window
		 *
		 * @param inputs
		 * @param id
		 * @private
		 */
		_parseJson: function (inputs, id) {
			var object = {
						action: 'epsilon_generate_typography_css',
						class : 'Epsilon_Typography',
						id    : id,
						data  : {
							'selectors': $('#selectors_' + id).val(),
							'json'     : {}
						}
					},
					api = wp.customize;

			$.each(inputs, function (index, value) {
				var key = $(value).attr('id'),
						replace = id + '-';
				key = key.replace(replace, '');

				object.data[ 'json' ][ key ] = $(value).val();
			});

			api.previewer.send('update-inline-css', object);
			return JSON.stringify(object.data);
		},

		/**
		 * Initiate the Number fields
		 *
		 * @param el
		 * @private
		 */
		_number: function (el) {
			var input = el.find('input');
			input.on('blur keypress keyup change', function () {
				var unit = $(this).siblings('span');
				if ( $(this).val() > 99 ) {
					unit.animate({ 'left': 35 }, 0);
				} else {
					unit.animate({ 'left': 25 }, 0);
				}
			});

			el.append('<a href="#" class="arrow-up incrementor"  data-increment="up"><span class="dashicons dashicons-arrow-up"></span></a>' +
					'<a href="#" class="arrow-down incrementor" data-increment="down"><span class="dashicons dashicons-arrow-down"></span></a>');
		},

		/**
		 * Calculate the value of the input number fields
		 *
		 * @param el
		 * @private
		 */
		_calcValue: function (el) {
			var input = $(el.siblings('input')),
					unit = input.siblings('span');

			switch ( $(el).attr('data-increment') ) {
				case 'up':
					if ( input.val() == 99 ) {
						unit.animate({ 'left': 35 }, 10);
					}
					input.val(parseInt(input.val()) + 1).trigger('change');
					break;
				case 'down':
					if ( input.val() == 0 ) {
						return;
					}
					if ( input.val() == 100 ) {
						unit.animate({ 'left': 25 }, 10);
					}
					input.val(parseInt(input.val()) - 1).trigger('change');
					break;
			}
		}
	};

	/**
	 * Recommended action section scripting
	 *
	 * @type {{_init: _init, dismissActions: dismissActions, dismissPlugins: dismissPlugins}}
	 */
	EpsilonFramework.recommendedActions = {
		/**
		 * Initiate the click actions
		 *
		 * @private
		 */
		_init: function () {
			var context = $('.control-section-epsilon-section-recommended-actions'),
					dismissPlugin = context.find('.epsilon-recommended-plugin-button'),
					dismissAction = context.find('.epsilon-dismiss-required-action');

			/**
			 * Dismiss actions
			 */
			this.dismissActions(dismissAction);
			/**
			 * Dismiss plugins
			 */
			this.dismissPlugins(dismissPlugin);
		},

		/**
		 * Dismiss actions function, hides the container and shows the next one while changing the INDEX in the title
		 * @param selectors
		 */
		dismissActions: function (selectors) {
			selectors.on('click', function () {
				/**
				 * During ajax, we lose scope - so declare "self"
				 * @type {*}
				 */
				var self = $(this),
						/**
						 * Get the container
						 */
						container = self.parents('.epsilon-recommended-actions-container'),
						/**
						 * Get the current index
						 *
						 * @type {Number}
						 */
						index = parseInt(container.attr('data-index')),
						/**
						 * Get the title
						 *
						 * @type {*}
						 */
						title = container.parents('.control-section-epsilon-section-recommended-actions').find('h3'),
						/**
						 * Get the indew from the notice
						 *
						 * @type {*}
						 */
						notice = title.find('.epsilon-actions-count > .current-index'),
						/**
						 * Get the total
						 *
						 * @type {Number}
						 */
						total = parseInt(notice.attr('data-total')),
						/**
						 * Get the next element ( this will be shown next )
						 */
						next = container.next(),
						/**
						 * Create the args object for the AJAX call
						 *
						 * action [ Class, Method Name ]
						 * args [ parameters to be sent to method ]
						 *
						 * @type {{action: [*], args: {id: *, option: *}}}
						 */
						args = {
							'action': [ 'Epsilon_Framework', 'dismiss_required_action' ],
							'args'  : {
								'id'    : $(this).attr('id'),
								'option': $(this).attr('data-option')
							}
						};

				/**
				 * Initiate the AJAX function
				 *
				 * Note that the Epsilon_Framework class, has the following method :
				 *
				 * public function epsilon_framework_ajax_action(){};
				 *
				 * which is used as a proxy to gather $_POST data, verify it
				 * and call the needed function, in this case : Epsilon_Framework::dismiss_required_action()
				 *
				 */
				$.ajax({
					type    : "POST",
					data    : { action: 'epsilon_framework_ajax_action', args: args },
					dataType: "json",
					url     : WPUrls.ajaxurl,
					success : function (data) {
						/**
						 * In case everything is ok, we start changing things
						 */
						if ( data.status && data.message === 'ok' ) {
							/**
							 * If it's the last element, show plugins
							 */

							if ( total <= index ) {
								var replace = title.find('.section-title'),
										plugins = $('.epsilon-recommended-plugins'),
										replaceText = replace.attr('data-social');
								if ( plugins.length ) {
									replaceText = replace.attr('data-plugin_text');
								}

								title.find('.epsilon-actions-count').remove();
								replace.text(replaceText);

							}
							/**
							 * Else, just change the index
							 */
							else {
								notice.text(index + 1);
							}

							/**
							 * Fade the current element and show the next one.
							 * We don't need to remove it at this time. Leave it to for server side
							 */
							container.fadeOut('200', function () {
								next.css({ opacity: 1, height: 'initial' }).fadeIn('200');
							})
						}
					},

					/**
					 * Throw errors
					 *
					 * @param jqXHR
					 * @param textStatus
					 * @param errorThrown
					 */
					error: function (jqXHR, textStatus, errorThrown) {
						console.log(jqXHR + " :: " + textStatus + " :: " + errorThrown);
					}
				});
			});
		},

		/**
		 * Dismiss plugins function, hides the container and shows the next one while changing the INDEX in the title
		 * @param selectors
		 */
		dismissPlugins: function (selectors) {
			selectors.on('click', function () {
				/**
				 * During ajax, we lose scope - so declare "self"
				 * @type {*}
				 */
				var self = $(this),
						/**
						 * Get the container
						 */
						container = self.parents('.epsilon-recommended-plugins'),
						/**
						 * Get the next element (this will be shown next)
						 */
						next = container.next(),
						/**
						 * Get the title
						 *
						 * @type {*}
						 */
						title = container.parents('.control-section-epsilon-section-recommended-actions').find('h3'),
						/**
						 * Create the args object for the AJAX call
						 *
						 * action [ Class, Method Name ]
						 * args [ parameters to be sent to method ]
						 *
						 * @type {{action: [*], args: {id: *, option: *}}}
						 */
						args = {
							'action': [ 'Epsilon_Framework', 'dismiss_required_action' ],
							'args'  : {
								'id'    : $(this).attr('id'),
								'option': $(this).attr('data-option')
							}
						};

				$.ajax({
					type    : "POST",
					data    : { action: 'epsilon_framework_ajax_action', args: args },
					dataType: "json",
					url     : WPUrls.ajaxurl,
					success : function (data) {
						/**
						 * In case everything is ok, we start changing things
						 */
						if ( data.status && data.message === 'ok' ) {
							/**
							 * Fade the current element and show the next one.
							 * We don't need to remove it at this time. Leave it to for server side
							 */
							container.fadeOut('200', function () {
								if ( next.is('p') ) {
									var replace = title.find('.section-title'),
											replaceText = replace.attr('data-social');

									replace.text(replaceText);
								}
								next.css({ opacity: 1, height: 'initial' }).fadeIn('200');
							})
						}
					},

					/**
					 * Throw errors
					 *
					 * @param jqXHR
					 * @param textStatus
					 * @param errorThrown
					 */
					error: function (jqXHR, textStatus, errorThrown) {
						console.log(jqXHR + " :: " + textStatus + " :: " + errorThrown);
					}
				});
			});
		}
	};

	/**
	 * Color scheme generator
	 *
	 */
	EpsilonFramework.colorSchemes = function () {
		/**
		 * Set variables
		 */
		var context = $('.epsilon-color-scheme');

		if ( !context.length ) {
			return;
		}

		var options = context.find('.epsilon-color-scheme-option'),
				input = context.parent().find('.epsilon-color-scheme-input'),
				json = $.parseJSON(options.first().find('input').val()),
				api = wp.customize,
				colorSettings = [],
				css = {
					action: 'epsilon_generate_color_scheme_css',
					class : 'Epsilon_Color_Scheme',
					id    : '',
					data  : {}
				};

		$.each(json, function (index, value) {
			colorSettings.push(index);
		});

		function updateCSS() {
			_.each(colorSettings, function (setting) {
				css.data[ setting ] = api(setting)();
			});
			api.previewer.send('update-inline-css', css)
		}

		_.each(colorSettings, function (setting) {
			api(setting, function (setting) {
				setting.bind(updateCSS);
			});
		});

		/**
		 * On clicking a color scheme, update the color pickers
		 */
		$('.epsilon-color-scheme-option').on('click', function () {
			var val = $(this).attr('data-color-id'),
					json = $.parseJSON($(this).find('input').val());

			/**
			 * find the customizer options
			 */
			$.each(json, function (index, value) {
				colorSettings.push(index);
				/**
				 * Set values
				 */
				wp.customize(index).set(value);
			});

			/**
			 * Remove the selected class from siblings
			 */
			$(this).siblings('.epsilon-color-scheme-option').removeClass('selected');
			/**
			 * Make active the current selection
			 */
			$(this).addClass('selected');
			/**
			 * Trigger change
			 */
			input.val(val).change();

			_.each(colorSettings, function (setting) {
				api(setting, function (setting) {
					setting.bind(updateCSS());
				});
			});
		});
	};

	EpsilonFramework.repeaterSection = {
		data   : _epsilonSections || {},
		api    : wp.customize || null,
		context: null,

		init: function (context) {
			/**
			 * Create a context for the panel
			 */
			this.context = context;
			/**
			 * Handle epsilon focus on reload
			 */
			this.handleEpsilonFocus();
			/**
			 * Handle the click event
			 */
			this.handleAddButton();
			/**
			 * Initiate the adding of a new section functionality
			 */
			this.addNewSection();
		},

		/**
		 * On page reload, check the parameters and focus the section
		 */
		handleEpsilonFocus: function () {
			var epsilonFocus = this.getCookie('epsilon_focus'),
					api = wp.customize;

			if ( epsilonFocus !== '' ) {
				/**
				 * Focus section now
				 */
				api[ 'panel' ](epsilonFocus, function (instance) {
					instance.deferred.embedded.done(function () {
						api.previewer.deferred.active.done(function () {
							instance.focus();
							document.cookie = 'epsilon_focus=; -1';
						});
					});
				});
			}
		},

		/**
		 * Handle the adding section button
		 *
		 * @private
		 */
		handleAddButton: function () {
			var panel = this.context;

			panel.container.find('.add-new-section').on('click keydown', function (e) {
				var isAddNewBtn = $(e.target).is('.add-new-section'),
						body = $('body');

				body.toggleClass('adding-section');
				if ( body.hasClass('adding-section') && !isAddNewBtn ) {
					panel.close();
				}
			});
		},

		/**
		 * Add new settings
		 *
		 * @param sectionId
		 * @param index
		 * @private
		 */
		_addNewSetting: function (sectionId, index) {
			var constructor,
					settingSectionId,
					setting,
					api = wp.customize;
			/**
			 * Create the customizer settings
			 */
			_.each(_epsilonSections.settings[ sectionId ], function (data, id) {
				settingSectionId = 'epsilon_sections[' + index + '][' + id + ']';
				constructor = api.settingConstructor[ data.type ] || api.Setting;

				if ( data.value === 'epsilon-identifier-hidden-input' ) {
					data.value = sectionId + index;
				}

				setting = new constructor(settingSectionId, data.value, {
					transport: data.transport,
					previewer: api.previewer,
					dirty    : !!data.dirty
				});

				api.add(settingSectionId, setting);
				console.log('setting added ' + settingSectionId);
			});

		},

		/**
		 * Add new controls
		 *
		 * @param sectionId
		 * @param contentSectionId
		 * @param index
		 * @private
		 */
		_addNewControls: function (sectionId, contentSectionId, index) {
			var constructor,
					controlSectionId,
					templateId,
					template,
					controller,
					control,
					api = wp.customize;

			/**
			 * Create the customizer controls
			 */
			_.each(_epsilonSections.controls[ sectionId ], function (data, id) {
				controlSectionId = 'epsilon_sections[' + index + '][' + id + ']';
				data.section = contentSectionId;
				templateId = 'customize-control-' + data.type + '-content';
				template = wp.template('customize-control-default-content');

				if ( $('#tmpl-' + templateId).length > 0 ) {
					template = wp.template(templateId);
				}

				controller = {
					type       : data.type,
					label      : data.label,
					description: data.description,
					value      : '',
					id         : controlSectionId,
					class      : 'customize-control customize-control-' + data.type
				};

				if ( data.type === 'hidden' ) {
					data.value = sectionId + index;
					controller.value = sectionId + index;
				}

				data.content = template(controller);
				constructor = api.controlConstructor[ data.type ] || api.Control;

				control = new constructor(controlSectionId, {
					params   : data,
					previewer: api.previewer
				});

				api.control.add(controlSectionId, control);
				console.log('control added ' + controlSectionId + ' to ' + contentSectionId);
			});
		},

		/**
		 * Add a new section
		 * @param sectionId
		 * @param contentSectionId
		 * @private
		 */
		_addNewSection: function (sectionId, contentSectionId) {
			var sectionData,
					constructor,
					api = wp.customize;
			/**
			 * Create customizer section
			 */
			sectionData = _epsilonSections.sections[ sectionId ];
			sectionData.id = contentSectionId;

			constructor = api.sectionConstructor[ sectionData.type ] || api.Section;
			var section = new constructor(contentSectionId, {
				params: sectionData
			});

			api.section.add(contentSectionId, section);
			console.log('section added ' + contentSectionId);
		},
		/**
		 * Add new section initiator on click event
		 *
		 * @private
		 */

		addNewSection : function () {
			var panel = this;
			$('.epsilon-section').click(function () {
				/**
				 * Grab the section id from the data attribute, so we know which template we need to render
				 */
				var sectionId = $(this).data('id'),
						/**
						 * Grab the index
						 */
						index = parseInt(_epsilonSections.total),
						/**
						 * Get the content section id
						 * @type {string}
						 */
						contentSectionId = sectionId + '_' + index,
						/**
						 * Get an instance of the api
						 */
						api = wp.customize;

				$('.section-control-remove').hide();
				/**
				 * Run proxies
				 * Add a new section
				 * Add new settings
				 * Add new controls -> bind them to the new settings and output it in the section
				 */
				panel._addNewSection(sectionId, contentSectionId);
				panel._addNewSetting(sectionId, index);
				panel._addNewControls(sectionId, contentSectionId, index);

				/**
				 * Increment index ( while outputting the controls through PHP,
				 * this is updated by a count() function, in real-time,
				 * we need to increment it manually)
				 */
				_epsilonSections.total = parseInt(index) + 1;

				/**
				 * Close the 'add new section sidebar'
				 */
				$('body').removeClass('adding-section');

				/**
				 * Focus section now
				 */
				api[ 'section' ](contentSectionId, function (instance) {
					instance.deferred.embedded.done(function () {
						api.previewer.deferred.active.done(function () {
							instance.focus();
						});
					});
				});

				/**
				 * Wait for the control to be ready
				 */
				api[ 'control' ]('epsilon_sections', function (instance) {
					instance.deferred.embedded.done(function () {
						api.previewer.deferred.active.done(function () {
							var currentSections = api.control('epsilon_sections').setting();
							/**
							 * FIRST CASE
							 * There is no option
							 */
							if ( typeof(currentSections) === 'string' && currentSections === '' ) {
								currentSections = [];
								/**
								 * SECOND CASE
								 * The options were already saved, we take values from DATABASE
								 */
							} else {
								currentSections = currentSections.slice();
							}

							currentSections.push('[' + index + ']');

							api.control('epsilon_sections').setting(currentSections);
						});
					});
				});

				api.bind('saved', function (request) {
					if ( typeof(request.setting_validities.epsilon_sections) !== 'undefined' && request.setting_validities.epsilon_sections ) {
						document.cookie = 'epsilon_focus=epsilon_panel_sections';
						location.reload();
					}
				});
			});
		},

		/**
		 * Delete section functionality
		 */
		deleteSection: function (context) {
			var control = context,
					api = wp.customize,
					removeBtn = control.container.find('a.section-control-remove');

			removeBtn.on('click', function (e) {
				var input = $.parseJSON($(this).siblings('input').val());
				var sectionId = input.type,
						index = input.index;

				// Collapse current section
				var sectionIndex = control.section();
				api.section(sectionIndex).collapse();

				/**
				 * Wait for the control to be ready
				 */
				api[ 'control' ]('epsilon_sections', function (instance) {
					instance.deferred.embedded.done(function () {
						api.previewer.deferred.active.done(function () {
							// Remove current section from options
							var currentSections = api.control('epsilon_sections').setting();
							if ( typeof(currentSections) === 'object' ) {
								currentSections = EpsilonFramework.repeaterSection.changeToArray(currentSections);
							}

							/**
							 * If we have an index, let's splice it and remove the element
							 */
							if ( index > -1 ) {
								currentSections.splice(index, 1);
							}

							/**
							 * Deactivate current setting
							 */
							api.section(sectionIndex).deactivate();
							api.section.remove(sectionIndex);

							$('.add-new-section').prop('disabled', true);

							/**
							 * Add the setting
							 */
							api.control('epsilon_sections').setting(currentSections);
						});
					});
				});

				api.bind('saved', function (request) {
					if ( typeof(request.setting_validities.epsilon_sections) !== 'undefined' && request.setting_validities.epsilon_sections ) {
						document.cookie = 'epsilon_focus=epsilon_panel_sections';
						location.reload();
					}
				});
			});
		},

		/**
		 * Helper function
		 *
		 * @param obj
		 * @returns {Array}
		 */
		changeToArray: function (obj) {
			return Object.keys(obj).map(function (key) {
				return obj[ key ];
			});
		},

		/**
		 * Helper function to get Parameter by name
		 * @param name
		 * @param url
		 * @returns {*}
		 */
		getCookie: function (name) {
			var name = name + "=",
					decodedCookie = decodeURIComponent(document.cookie),
					ca = decodedCookie.split(';');

			for ( var i = 0; i < ca.length; i++ ) {
				var c = ca[ i ];
				while ( c.charAt(0) === ' ' ) {
					c = c.substring(1);
				}
				if ( c.indexOf(name) === 0 ) {
					return c.substring(name.length, c.length);
				}
			}
			return '';
		}
	};

	/**
	 * Load the range sliders for the widget updates
	 */
	$(document).on('widget-updated widget-added', function (a, selector) {
		if ( jQuery().slider ) {
			EpsilonFramework.rangeSliders(selector);
		}
	});

	if ( typeof(wp) !== 'undefined' ) {
		if ( typeof(wp.customize) !== 'undefined' ) {
			wp.customize.bind('ready', function () {
				EpsilonFramework.typography._init();
				EpsilonFramework.colorSchemes();
				EpsilonFramework.recommendedActions._init();
			});

			wp.customize.sectionConstructor[ 'epsilon-section-pro' ] = wp.customize.Section.extend({
				attachEvents        : function () {
				},
				isContextuallyActive: function () {
					return true;
				}
			});

			wp.customize.sectionConstructor[ 'epsilon-section-recommended-actions' ] = wp.customize.Section.extend({
				attachEvents        : function () {
				},
				isContextuallyActive: function () {
					return true;
				}
			});

			wp.customize.panelConstructor[ 'epsilon-section-repeater' ] = wp.customize.Panel.extend({
				ready: function () {
					EpsilonFramework.repeaterSection.init(this);
				},

				close: function () {
					$('body').removeClass('adding-section');
				},

				isContextuallyActive: function () {
					return true;
				}
			});

			wp.customize.controlConstructor[ 'epsilon-section-area' ] = wp.customize.Control.extend({
				ready: function () {

				}
			});

			wp.customize.controlConstructor[ 'epsilon-section-delete' ] = wp.customize.Control.extend({
				ready: function () {
					EpsilonFramework.repeaterSection.deleteSection(this);
				}
			});

			wp.customize.controlConstructor[ 'epsilon-toggle' ] = wp.customize.Control.extend({
				ready: function () {

				}
			});
		}
	}

})(jQuery);