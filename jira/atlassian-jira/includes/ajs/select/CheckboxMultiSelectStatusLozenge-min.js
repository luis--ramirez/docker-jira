define("jira/ajs/select/checkbox-multi-select-status-lozenge",["jira/ajs/select/checkbox-multi-select","jquery"],function(CheckboxMultiSelect,jQuery){return CheckboxMultiSelect.extend({_getCustomRenders:function(){var renders=this._super();renders.suggestionItemStatusLozenge=this._renders.suggestionItemStatusLozenge;return renders},_renders:{suggestionItemStatusLozenge:function(descriptor){var $checkbox=jQuery("<input type='checkbox' tabindex='-1' />").val(descriptor.value()),$listElem=jQuery('<li class="check-list-item" role="option" id="'+descriptor.value()+"-"+this.options.id+'">'),$label=jQuery("<label class='item-label' />");if(descriptor.styleClass()){$listElem.addClass(descriptor.styleClass())}$label.html(JIRA.Template.Util.Issue.Status.issueStatusResolver({issueStatus:descriptor.model().data("simple-status"),isSubtle:true}));if(descriptor.selected()){$checkbox.attr("checked","checked")}if(descriptor.title()){$label.attr("data-descriptor-title",descriptor.title())}if(descriptor.disabled()){$listElem.addClass("disabled");$checkbox.attr("disabled","disabled")}$label.prepend($checkbox);$listElem.append($label);return $listElem},suggestionItemResolver:function(descriptor,replacementText){if(descriptor.model().data("simple-status")){return this._render("suggestionItemStatusLozenge",descriptor)}else{return this._render("suggestionItemElement",descriptor,replacementText)}}}})});AJS.namespace("AJS.CheckboxMultiSelectStatusLozenge",null,require("jira/ajs/select/checkbox-multi-select-status-lozenge"));