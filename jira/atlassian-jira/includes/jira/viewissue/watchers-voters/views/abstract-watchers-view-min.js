define("jira/viewissue/watchers-voters/views/abstract-watchers-view",["require"],function(require){var AuiMessages=require("aui/message");var Backbone=require("backbone");var _=require("underscore");var jQuery=require("jquery");return Backbone.View.extend({$empty:undefined,renderNoWatchers:function(){if(this.$(".recipients li").length===0){this.$empty=AuiMessages.info({closeable:false,body:AJS.I18n.getText("watcher.manage.nowatchers")});this.$("fieldset").append(this.$empty)}else{if(this.$empty){this.$empty.remove()}}},render:function(){var deferred=jQuery.Deferred();this.collection.fetch().done(_.bind(function(){this._render();this.renderNoWatchers();deferred.resolve(this.$el);setTimeout(_.bind(function(){this.focus()},this),0)},this));return deferred.promise()},watch:function(){jQuery("#watching-toggle").text(AJS.I18n.getText("issue.operations.simple.stopwatching"))},unwatch:function(){jQuery("#watching-toggle").text(AJS.I18n.getText("issue.operations.simple.startwatching"))},focus:jQuery.noop,_incrementWatcherCount:function(){var $el=jQuery("#watcher-data");var currentCount=parseInt($el.text(),10);$el.text(currentCount+1);this.renderNoWatchers()},_decrementWatcherCount:function(){var $el=jQuery("#watcher-data");var currentCount=parseInt($el.text(),10);$el.text(currentCount-1);this.renderNoWatchers()}})});