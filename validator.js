function Validator(formSelector) {
    function getParentElement(element, selector) {
        return element.closest(selector);
    }

    var formRules = {};
    var validatorRules = {
        required: function (value) {
            return value ? undefined : "Vui lòng nhập trường này";
        },
        email: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : "Vui lòng nhập email";
        },
        min: function (min) {
            return function (value) {
                return value.length >= min
                    ? undefined
                    : `Vui lòng nhập ít nhât ${min} ký tự`;
            };
        },
        max: function (max) {
            return function (value) {
                return value.length >= max
                    ? undefined
                    : `Vui lòng nhập nhiều nhât ${max} ký tự`;
            };
        },
    };

    var formElement = document.querySelector(formSelector);

    if (formElement) {
        var inputs = formElement.querySelectorAll("[name][rules]");

        inputs.forEach(function (input) {
            var rules = input.getAttribute("rules").split("|");

            for (var rule of rules) {
                var isRuleHasValue = rule.includes(":");
                var ruleInfo;

                if (isRuleHasValue) {
                    ruleInfo = rule.split(":");
                    rule = ruleInfo[0];
                    validatorRules[rule](ruleInfo[1]);
                }

                var ruleFn = validatorRules[rule];

                if (isRuleHasValue) {
                    ruleFn = ruleFn(ruleInfo[1]);
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFn);
                } else {
                    formRules[input.name] = [ruleFn];
                }
            }

            //listen events for validation
            input.onblur = handleValidation;
            input.oninput = handleClearError;
        });
        //validate function
        function handleValidation(e) {
            console.log(formRules[e.target.name]);

            var rules = formRules[e.target.name];
            var errorMessage;

            for (var rule of rules) {
                errorMessage = rule(e.target.value);
                if (errorMessage) break;
            }

            if (errorMessage) {
                var formGroup = getParentElement(e.target, ".form-group");

                if (formGroup) {
                    formGroup.classList.add("invalid");
                    var formMessage = formGroup.querySelector(".form-message");
                    if (formMessage) {
                        formMessage.innerText = errorMessage;
                    }
                }
            }

            return !errorMessage;
        }

        //clear error function
        function handleClearError(e) {
            var formGroup = getParentElement(e.target, ".form-group");

            if (formGroup.classList.contains("invalid")) {
                formGroup.classList.remove("invalid");

                var formMessage = formGroup.querySelector(".form-message");
                if (formMessage) {
                    formMessage.innerText = "";
                }
            }
        }
    }

    console.log(this);

    //form submit handler
    formElement.onsubmit = (e) => {
        e.preventDefault();

        var inputs = formElement.querySelectorAll("[name][rules]");
        var isValidForm = true;

        inputs.forEach(function (input) {
            // console.log(input.name);

            if (
                !handleValidation({
                    target: input,
                })
            ) {
                isValidForm = false;
            }
        });

        if (isValidForm) {
            if (typeof this.onSubmit === "function") {
                var enableInputs = formElement.querySelectorAll(
                    "[name]:not([disabled])"
                );
                var formValues = Array.from(enableInputs).reduce(function (
                    values,
                    input
                ) {
                    switch (input.type) {
                        case "radio":
                            if (!input.matches(":checked")) {
                                values[input.name] = "";
                                return values;
                            }
                            values[input.name] = formElement.querySelector(
                                "input[name='" + input.name + "']:checked"
                            ).value;
                            break;
                        case "checkbox":
                            if (!input.matches(":checked")) return values;
                            if (!Array.isArray(values[input.name])) {
                                values[input.name] = [];
                            }
                            values[input.name].push(input.value);
                            break;
                        case "file":
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value;
                    }

                    return values;
                },
                {});

                //On submit Callback and return form data
                this.onSubmit(formValues);
            } else {
                formElement.submit();
            }
        }
    };
}
