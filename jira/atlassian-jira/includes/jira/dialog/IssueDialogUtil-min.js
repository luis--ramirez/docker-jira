define("jira/dialog/dialog-util",["jira/issuenavigator/issue-navigator","jquery"],function(IssueNavigator,jQuery){var DialogUtil={};DialogUtil.getDefaultAjaxOptions=function(){if(JIRA&&typeof JIRA.Dialogs.getDefaultAjaxOptions==="function"){if(DialogUtil.getDefaultAjaxOptions!==JIRA.Dialogs.getDefaultAjaxOptions){return JIRA.Dialogs.getDefaultAjaxOptions.apply(this,arguments)}}var $focusRow=IssueNavigator.get$focusedRow();var linkIssueURI=this.options.url||this.getRequestUrlFromTrigger();if(/id=\{0\}/.test(linkIssueURI)){if(!$focusRow.length){return false}else{linkIssueURI=linkIssueURI.replace(/(id=\{0\})/,"id="+$focusRow.attr("rel"))}}if(IssueNavigator.isNavigator()){var result=/[?&]id=([0-9]+)/.exec(linkIssueURI);this.issueId=result&&result.length===2?result[1]:null;if(this.issueId!==$focusRow.attr("rel")){IssueNavigator.Shortcuts.focusRow(this.issueId);$focusRow=IssueNavigator.get$focusedRow()}this.issueKey=IssueNavigator.getSelectedIssueKey()}return{url:linkIssueURI,data:{decorator:"dialog",inline:"true"}}};DialogUtil.BeforeShowIssueDialogHandler=(function(){var deferreds=[];return{add:function(deferred){deferreds.push(deferred);return this},execute:function(){var invokedDeferreds=[];if(deferreds.length===0){return jQuery.Deferred().resolve()}else{jQuery.each(deferreds,function(idx,deferred){invokedDeferreds.push(deferred())});return jQuery.when.apply(jQuery,invokedDeferreds)}}}})();DialogUtil.storeCurrentIssueIdOnSucessfulSubmit=function(){if(IssueNavigator.isNavigator()){IssueNavigator.setIssueUpdatedMsg({issueMsg:this.options.issueMsg,issueId:this.issueId,issueKey:this.issueKey})}};return DialogUtil});(function(utils){AJS.namespace("JIRA.Dialogs",null,require("jira/dialog/dialog-register"));AJS.namespace("JIRA.Dialogs.getDefaultAjaxOptions",null,utils.getDefaultAjaxOptions);AJS.namespace("JIRA.Dialogs.BeforeShowIssueDialogHandler",null,utils.BeforeShowIssueDialogHandler);AJS.namespace("JIRA.Dialogs.storeCurrentIssueIdOnSucessfulSubmit",null,utils.storeCurrentIssueIdOnSucessfulSubmit)})(require("jira/dialog/dialog-util"));