var edx = edx || {};

(function (Backbone, $, _, gettext) {
    'use strict';

    edx.instructor_dashboard = edx.instructor_dashboard || {};
    edx.instructor_dashboard.proctoring = edx.instructor_dashboard.proctoring || {};

    edx.instructor_dashboard.proctoring.AddAllowanceView = Backbone.ModalView.extend({
        name: "AddAllowanceView",
        template: null,
        template_url: '/static/proctoring/templates/add-new-allowance.underscore',
        initialize: function (options) {
            this.proctored_exams = options.proctored_exams;
            this.proctored_exam_allowance_view = options.proctored_exam_allowance_view;
            this.course_id = options.course_id;
            this.allowance_types = options.allowance_types;
            this.model = new edx.instructor_dashboard.proctoring.ProctoredExamAllowanceModel();
            _.bindAll(this, "render");
            this.loadTemplateData();
            //Backbone.Validation.bind( this,  {valid:this.hideError, invalid:this.showError});
        },
        events: {
            "submit form": "addAllowance",
            "change #proctored_exam": 'selectExam',
            "change #allowance_type": 'selectAllowance'
        },
        loadTemplateData: function () {
            var self = this;
            $.ajax({url: self.template_url, dataType: "html"})
                .error(function (jqXHR, textStatus, errorThrown) {

                })
                .done(function (template_data) {
                    self.template = _.template(template_data);
                    self.render();
                    self.showModal();
                    self.selectExamAtIndex(0);

                    setTimeout(function() {
                        if (window.CustomizeFunctionsHook && window.CustomizeFunctionsHook['dropdown'] && typeof CustomizeFunctionsHook['dropdown'] === 'function') {
                            window.CustomizeFunctionsHook.dropdown();
                        }
                    });
                });
        },
        getCurrentFormValues: function () {
            return {
                proctored_exam: $("select#proctored_exam").val(),
                allowance_type: $("select#allowance_type").val(),
                allowance_value: $("#allowance_value").val(),
                user_info: $("#user_info").val()
            };
        },
        hideError: function (view, attr, selector) {
            var $element = view.$form[attr];

            $element.removeClass("error");
            $element.parent().parent().find(".error-message").empty();
        },
        showError: function (view, attr, errorMessage, selector) {
            var $element = view.$form[attr];

            $element.addClass("error");
            var $errorMessage = $element.parent().find(".error-message");
            if ($errorMessage.length == 0) {
                $errorMessage = $("<div class='error-message'></div>");
                $element.parent().parent().append($errorMessage);
            }

            $errorMessage.empty().append(errorMessage);
        },
        addAllowance: function (event) {
            event.preventDefault();
            var error_response = $('.error-response');
            error_response.html();
            var values = this.getCurrentFormValues();
            var formHasErrors = false;


            var self = this;
            $.each(values, function(key, value) {
                if (value==="") {
                    formHasErrors = true;
                    self.showError(self, key, gettext("Required field"));
                }
                else {
                    self.hideError(self, key);
                }
            });

            if (!formHasErrors) {
                self.model.fetch({
                    headers: {
                        "X-CSRFToken": self.proctored_exam_allowance_view.getCSRFToken()
                    },
                    type: 'PUT',
                    data: {
                        'exam_id': values.proctored_exam,
                        'user_info': values.user_info,
                        'key': values.allowance_type,
                        'value': values.allowance_value
                    },
                    success: function () {
                        // fetch the allowances again.
                        error_response.html();
                        self.proctored_exam_allowance_view.collection.url = self.proctored_exam_allowance_view.initial_url + self.course_id + '/allowance';
                        self.proctored_exam_allowance_view.hydrate();
                        self.hideModal();
                    },
                    error: function(self, response, options) {
                        var data = $.parseJSON(response.responseText);
                        error_response.html(gettext(data.detail));
                    }
                });
            }
        },
        selectExamAtIndex: function (index) {
            var selectedExam = this.proctored_exams[index];

            if (selectedExam && selectedExam.is_proctored) {
                // Selected Exam is a Proctored or Practice-Proctored exam.
                if (selectedExam.is_practice_exam)
                    $('#exam_type_label').text(gettext('Practice Exam'));
                else
                    $('#exam_type_label').text(gettext('Proctored Exam'));

                // In case of Proctored Exams, we hide the Additional Time label and show the Allowance Types Select
                $('#additional_time_label').hide();
                $('select#allowance_type').val('additional_time_granted').show();
            }
            else {
                // Selected Exam is a Timed Exam.
                $('#exam_type_label').text(gettext('Timed Exam'));

                // In case of Timed Exams, we show the "Additional Time" label and hide the Allowance Types Select
                $('#additional_time_label').show();
                // Even though we have the Select element hidden, the backend will still be using
                // the Select's value for the allowance type (key).
                $('select#allowance_type').val('additional_time_granted').hide();
            }
            this.updateAllowanceLabels('additional_time_granted');
        },
        selectExam: function (event) {
            this.selectExamAtIndex($('#proctored_exam')[0].selectedIndex);
        },
        selectAllowance: function (event) {
            this.updateAllowanceLabels($('#allowance_type').val());
        },
        updateAllowanceLabels: function (selectedAllowanceType) {
            if (selectedAllowanceType == 'additional_time_granted') {
                $('#minutes_label').show();
                $('#allowance_value_label').text(gettext('Additional Time'));
            }
            else {
                $('#minutes_label').hide();
                $('#allowance_value_label').text(gettext('Value'));
            }
        },

        render: function () {
            $(this.el).html(this.template({
                proctored_exams: this.proctored_exams,
                allowance_types: this.allowance_types
            }));

            this.$form = {
                proctored_exam: this.$("select#proctored_exam"),
                allowance_type: this.$("select#allowance_type"),
                allowance_value: this.$("#allowance_value"),
                user_info: this.$("#user_info")
            };
            return this;
        }
    });
}).call(this, Backbone, $, _, gettext);
