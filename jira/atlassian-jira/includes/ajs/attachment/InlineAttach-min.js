define("jira/attachment/inline-attach",["jira/lib/class","jira/xsrf","jira/util/navigator","jquery"],function(Class,XSRF,Navigator,jQuery){var InlineAttach=Class.extend({init:function(element){var $element=jQuery(element);if(InlineAttach.AjaxPresenter.isSupported($element)){new InlineAttach.AjaxPresenter($element)}else{new InlineAttach.FormPresenter($element)}}});jQuery.extend(InlineAttach,{MAX_UPLOADS:2,DISPLAY_WAIT:600,rescope:function(fn,scope){if(fn){if(scope){return jQuery.proxy(fn,scope)}else{return fn}}else{return jQuery.noop}},copyArrayLike:function(array){return jQuery.makeArray(array)},Renderers:{container:function(){return jQuery("<div class='field-group'/>")}}});InlineAttach.Presenter=Class.extend({init:function(){this.cancelled=false;this.running=[];this.waiting=[]},_addUpload:function(upload){if(!this.cancelled){if(this.running.length>=InlineAttach.MAX_UPLOADS){this.waiting.push(upload)}else{this.running.push(upload);upload.upload()}}return this.running.length>0},_finishUpload:function(upload){if(!this.cancelled){InlineAttach.Presenter.removeFromArray(this.waiting,upload);if(InlineAttach.Presenter.removeFromArray(this.running,upload)){if(this.waiting.length>0){var next=this.waiting.shift();this.running.push(next);next.upload()}}}return this.running.length>0},_cancel:function(){this.cancelled=true;var i;var wait=InlineAttach.copyArrayLike(this.waiting);for(i=0;i<wait.length;i++){wait[i].abort()}var run=InlineAttach.copyArrayLike(this.running);for(i=0;i<run.length;i++){run[i].abort()}this.waiting=[];this.running=[]}});jQuery.extend(InlineAttach.Presenter,{removeFromArray:function(array,element){var index=jQuery.inArray(element,array);if(index>=0){return array.splice(index,1)}else{return null}}});InlineAttach.FormPresenter=InlineAttach.Presenter.extend({init:function($element){this._super();this.form=new InlineAttach.Form(new InlineAttach.FileInput($element,false));this.form.fileSelector.onChange(jQuery.proxy(this._attach,this));this.form.onCancel(jQuery.proxy(this._cancel,this))},_attach:function(fileName){this.form.clearErrors();if(this.cancelled){return }var form=this.form,data=this._createSubmitData();var $oldInput=form.cloneFileInput();form.fileSelector.clear();var progress=form.addStaticProgress(fileName);var timer=new InlineAttach.Timer(function(){!this.cancelled&&progress.show()},this);var upload=new InlineAttach.FormUpload({$input:$oldInput,url:InlineAttach.FormPresenter.DEFAULT_URL,params:data,scope:this,before:function(){!this.cancelled&&progress.start()},success:function(val){if(this.cancelled){return }if(val.id&&val.name){form.addTemporaryFileCheckbox(val.id,val.name,progress)}else{if(val.errorMsg){form.addErrorWithFileName(val.errorMsg,fileName,progress)}else{form.addError(InlineAttach.Text.tr("upload.error.bad.response",fileName),progress)}}},error:function(text){if(this.cancelled){return }if(text.indexOf("SecurityTokenMissing")>=0){form.addError(InlineAttach.Text.tr("upload.xsrf.timeout",fileName),progress)}else{form.addError(InlineAttach.Text.tr("upload.error.unknown",fileName),progress)}},after:function(){timer.cancel();progress.remove();if(!this.cancelled&&!this._finishUpload(upload)){form.enable()}}});progress.onCancel(function(){upload.abort()});if(this._addUpload(upload)){timer.schedule(InlineAttach.DISPLAY_WAIT);form.disable()}form.fileSelector.focus()},_cancel:function(){this._super();this.form.enable()},_createSubmitData:function(){var data={atl_token:this.form.getAtlToken(),formToken:this.form.getFormToken()};if(this.form.issueId){data.id=this.form.issueId}else{if(this.form.projectId){data.create=true;data.projectId=this.form.projectId}else{throw"Unable to find either an issueId or projectId to submit the attachment to."}}return data}});InlineAttach.FormPresenter.DEFAULT_URL=contextPath+"/secure/AttachTemporaryFile.jspa?decorator=none";InlineAttach.AjaxPresenter=InlineAttach.Presenter.extend({init:function($element){this._super();this.form=new InlineAttach.Form(new InlineAttach.FileInput($element,true));this.form.fileSelector.onChange(jQuery.proxy(this._attach,this));this.form.onCancel(jQuery.proxy(this._cancel,this))},_attach:function(files){this.form.clearErrors();if(this.cancelled){return }if(files&&files.length>0){files=this._checkAndFilterFiles(files);if(files){this._uploadFiles(files)}}this.form.fileSelector.clear().focus()},_checkAndFilterFiles:function(files){if(files.length>InlineAttach.AjaxPresenter.MAX_SELECTED_FILES){this.form.addError(InlineAttach.Text.tr("upload.error.too.many.files",files.length,InlineAttach.AjaxPresenter.MAX_SELECTED_FILES));return null}var maxSize=this.form.maxSize;var newFiles=[];for(var i=0;i<files.length;i++){try{var file=files[i];if(file.size===0){this.form.addError(InlineAttach.Text.tr("upload.empty.file",file.name))}else{if(maxSize>0&&file.size>maxSize){var sizes=InlineAttach.Text.fileSize(maxSize,file.size);this.form.addError(InlineAttach.Text.tr("upload.too.big",file.name,sizes[1],sizes[0]))}else{newFiles.push({name:file.name,size:file.size,file:file})}}}catch(e){this.form.addError(InlineAttach.AjaxUpload.getClientErrorMessage(e,file))}}return newFiles.length===0?null:newFiles},_createSubmitData:function(){var data={atl_token:this.form.getAtlToken(),formToken:this.form.getFormToken()};if(this.form.issueId){data.issueId=this.form.issueId}else{if(this.form.projectId){data.projectId=this.form.projectId}else{throw"Unable to find either an issueId or projectId to submit the attachment to."}}return data},_uploadFiles:function(files){var form=this.form,data=this._createSubmitData(),that=this,running=false;jQuery.each(files,function(){var progress=form.addProgress(this),file=this;var timer=new InlineAttach.Timer(function(){if(!that.cancelled){progress.show()}});var upload=new InlineAttach.AjaxUpload({file:file.file,params:jQuery.extend({filename:file.name,size:file.size},data),scope:that,url:InlineAttach.AjaxPresenter.DEFAULT_URL,before:function(){!this.cancelled&&progress.start()},progress:function(val){!this.cancelled&&progress.update(val)},success:function(val,status){if(this.cancelled){return }if(status===201){if(val.id!==undefined&&val.name!==undefined){form.addTemporaryFileCheckbox(val.id,val.name,progress,file.file)}else{form.addError(InlineAttach.Text.tr("upload.error.bad.response",file.name),progress)}}else{if(val.token){form.setAtlToken(val.token)}if(val.errorMessage){form.addErrorWithFileName(val.errorMessage,file.name,progress)}else{form.addError(this._getErrorFromStatus(status,file),progress)}}},error:function(text,status){if(this.cancelled){return }if(status<0){form.addError(text,progress)}else{var statusError=this._getErrorFromStatus(status,file);if(statusError){form.addError(statusError,progress)}else{form.addError(InlineAttach.Text.tr("upload.error.unknown",file.name),progress)}}},after:function(){timer.cancel();progress.finish().remove();if(!this.cancelled&&!this._finishUpload(upload)){form.enable()}}});progress.onCancel(function(){upload.abort()});if(that._addUpload(upload)){running=true;timer.schedule(InlineAttach.DISPLAY_WAIT)}});if(running){this.form.disable()}},_getErrorFromStatus:function(status,file){var error;if(status===0){error=InlineAttach.Text.tr("upload.error.server.no.reply",file.name)}else{if(status===400){error=InlineAttach.Text.tr("upload.error.badrequest",file.name)}else{if(status===401){error=InlineAttach.Text.tr("upload.error.auth",file.name)}else{error=InlineAttach.Text.tr("upload.error.unknown.status",file.name,status)}}}return error},_cancel:function(){this._super();this.form.enable()}});jQuery.extend(InlineAttach.AjaxPresenter,{DEFAULT_URL:contextPath+"/rest/internal/2/AttachTemporaryFile",MAX_SELECTED_FILES:100,isSupported:function($element){if(!$element||!$element[0]||!$element[0].files){return false}else{return InlineAttach.AjaxUpload.isSupported()}}});InlineAttach.FileInput=Class.extend({init:function($fileInput,testMultiple){this.$element=$fileInput;this.$container=$fileInput.parent();if(testMultiple&&this.$element[0].files!==undefined){this.$element.attr("multiple","multiple");this.multiple=true}else{this.multiple=false}},clear:function(){this.$element.val("");return this},getFiles:function(){return this.$element[0].files},hasFiles:function(){return this.getFiles().length>0},onChange:function(callback){var that=this;this.$element.change(function(){if(that.multiple){callback.call(that,this.files)}else{callback.call(that,that.getFileName())}});return this},focus:function(){if(this._isIE()){var $e=this.$element;setTimeout(function(){$e.focus()},0)}else{this.$element.focus()}return this},cloneInput:function(){var oldElement=this.$element;oldElement.replaceWith(this.$element=oldElement.clone(true));oldElement.unbind();return oldElement},getFileName:(function(){var fakepath=/^c:\\fakepath\\(?!$)/i;return function(){var fileName=this.$element.val();fileName=fileName.replace(fakepath,"");if(this._isIE()&&fileName.indexOf("\\")>=0){fileName=fileName.substring(fileName.lastIndexOf("\\")+1)}return fileName}})(),_isIE:function(){return Navigator.isIE()&&Navigator.majorVersion()<11},before:function(el){if(el){if(el.$element){el=el.$element}this.$container.before(el)}}});(function(){var options={showPercentage:false,height:"2px"},count=0;InlineAttach.ProgressBar=Class.extend({init:function(){var $container=this.$element=this._renderers.container();this.$progress=this._renderers.progress().appendTo($container);this.$progress.progressBar(0,options);this.hidden=true;this.old=0},value:function(value){if(value>100){value=100}else{if(value<0){value=0}}if(this.hidden){this.$progress.show();this.hidden=false}if(this.old!==value){this.$progress.progressBar(value,options);if(value>=100){this.$progress.fadeOut()}this.old=value}},_renderers:{container:function(){return jQuery("<div>").addClass("file-progress")},progress:function(){return jQuery("<div>").attr("id","upload-progress-"+(count++)).hide()}}})})();InlineAttach.UploadProgress=Class.extend({init:function(file){var $container=this.$element=InlineAttach.Renderers.container().hide();var progress=this.progress=new InlineAttach.ProgressBar();var content=this._renders.content(file.name);this.$content=content.$content;this.$cancel=content.$cancel;$container.append(content.$element).append(progress.$element);this.total=file.size;this.current=0;this.name=file.name;this.timer=new InlineAttach.Timer(this._update,this);this.rateNumerator=0;this.rateDenominator=0;this._title(InlineAttach.Text.tr("upload.progress.title.waiting"))},start:function(){this.started=this._now();this.startedSize=0;return this},update:function(current){this.timer.cancel();return this._update(current)},_update:function(current){var now=this._now();if(current===undefined){current=this.current}else{if(current!==this.current){this.lastUpdate=now;this.current=current}}var text=InlineAttach.Text;var percentage=Math.min(100,Math.round(current/this.total*100));var partSize=text.currentOutOfTotalSize(current,this.total);var rateDisplay,remainingDisplay;this.progress.value(percentage);var timeDiff=(now-this.started)/1000;if(timeDiff>=2){if(this.startedSize>0){this._addRate((current-this.startedSize)/timeDiff)}this.started=now;this.startedSize=current}var rate=this._calcRate();if(current>=InlineAttach.UploadProgress.DATA_MIN&&rate>0){var remaining=Math.max(1,(this.total-current)/rate);rateDisplay=text.rate(rate);remainingDisplay=text.time(remaining)}if(now-this.lastUpdate>=InlineAttach.UploadProgress.STALLED_TIMEOUT){this._content(text.tr("upload.file.stalled",this.name));if(rateDisplay){this._title(text.tr("upload.progress.title.known.stalled",rateDisplay,partSize))}else{this._title(text.tr("upload.progress.title.unknown.stalled",partSize))}}else{if(rateDisplay){this._title(text.tr("upload.progress.title.known",rateDisplay,partSize,remainingDisplay));this._content(text.tr("upload.file.remaining",this.name,remainingDisplay))}else{this._title(partSize);this._content(this.name)}}if(current<this.total){this.timer.schedule(InlineAttach.UploadProgress.UPLOAD_REFRESH)}return this},finish:function(){this.progress.value(100);this.timer.cancel();return this},onCancel:function(callback){var that=this;this.$cancel.click(function(e){e.preventDefault();callback.call(that)});return this},remove:function(){this.$element.remove();return this},hide:function(){this.$element.hide();return this},show:function(){this.$element.fadeIn();return this},_title:function(title){this.$element.attr("title",title);return this},_content:function(rem){this.$content.text(rem);return this},_addRate:function(rate){var weight=InlineAttach.UploadProgress.WEIGHT;this.rateNumerator=this.rateNumerator*weight+rate;this.rateDenominator=this.rateDenominator*weight+1},_calcRate:function(){if(this.rateDenominator===0){return 0}var value=this.rateNumerator/this.rateDenominator;if(Math.abs(value)<0.005){return 0}else{return value}},_now:function(){return new Date().getTime()},_renders:{content:function(fileName){var text=InlineAttach.Text.tr("upload.file.waiting",fileName);var $container=jQuery("<div class='loading file'>");var $content=jQuery("<span>").text(text);var $cancel=jQuery("<a href='#'/>").text(InlineAttach.Text.tr("upload.cancel"));$container.append($content).append(" ").append($cancel);return{$element:$container,$content:$content,$cancel:$cancel}}}});jQuery.extend(InlineAttach.UploadProgress,{STALLED_TIMEOUT:10000,UPLOAD_REFRESH:2000,DATA_MIN:20*1024,WEIGHT:0.7});InlineAttach.UnknownProgress=Class.extend({init:function(fileName){var content=this._renders.content(fileName);this.$element=content.$element;this.$cancel=content.$cancel;this.$content=content.$content;this.fileName=fileName;this._title(InlineAttach.Text.tr("upload.progress.title.waiting"))},remove:function(){this.$element.remove();return this},hide:function(){this.$element.hide();return this},show:function(){this.$element.fadeIn();return this},start:function(){this._title(InlineAttach.Text.tr("upload.progress.title.running"));this._content(this.fileName);return this},onCancel:function(callback){var that=this;this.$cancel.click(function(e){e.preventDefault();callback.call(that)});return this},_title:function(title){this.$element.attr("title",title);return this},_content:function(text){this.$content.text(text);return this},_renders:{content:function(fileName){var text=InlineAttach.Text.tr("upload.file.waiting",fileName);var $cancel=jQuery("<a href='#'/>").text(InlineAttach.Text.tr("upload.cancel"));var $loading=jQuery("<div class='loading file'>");var $content=jQuery("<span>").text(text);$loading.append($content).append(" ").append($cancel);var $container=InlineAttach.Renderers.container().append($loading);return{$element:$container,$cancel:$cancel,$content:$content}}}});InlineAttach.Form=Class.extend({init:function(fileInput){this.fileSelector=fileInput;this.$form=fileInput.$element.closest("form");this.maxSize=parseInt(this.$form.find("#attach-max-size").text()||jQuery("#attach-max-size").text());if(isNaN(this.maxSize)){throw"Unable to find maximum upload size on form."}var assigned=false;var val=parseInt(this.$form.find(":input[name=id]").val());if(!isNaN(val)){assigned=true;this.issueId=val}val=parseInt(this.$form.find(":input[name=pid]").val());if(!isNaN(val)){assigned=true;this.projectId=val}if(!assigned){throw"Unable to find either an issueId or projectId to submit the attachment to."}},getAtlToken:function(){var $atlToken=this.$form.find("input[name='atl_token']");if($atlToken.length>0){return $atlToken.val()}else{return atl_token()}},setAtlToken:function(token){var $token=this.$form.find("input[name='atl_token']");if($token.length>0){$token.val(token)}else{XSRF.updateTokenOnPage(token)}return this},getFormToken:function(){var $formToken=this.$form.find("input[name='formToken']");if($formToken.length>0){return $formToken.val()}else{return null}},disable:function(){this._getFormSubmits().attr("disabled","disabled");return this},enable:function(){this._getFormSubmits().removeAttr("disabled");return this},addProgress:function(file){var prog=new InlineAttach.UploadProgress(file);this._addElement(prog.$element);return prog},addStaticProgress:function(fileName){var prog=new InlineAttach.UnknownProgress(fileName);this._addElement(prog.$element);return prog},addTemporaryFileCheckbox:function(value,name,replaceObj,file){var $thumbNail=this.addLocalThumbnailImage(name,file);var $element=InlineAttach.Renderers.container();var $label=jQuery("<label>").attr("for","filetoconvert-"+value).text(name);var $check=jQuery("<input type='checkbox' class='checkbox' name='filetoconvert' checked='checked'>").attr({"id":"filetoconvert-"+value,"value":value,"title":InlineAttach.Text.tr("upload.checkbox.title")});$element.append($check).append($label);if($thumbNail){$element.append(jQuery("<br/>")).append($thumbNail)}$element.hide();this._replaceElement($element,replaceObj);return this},addLocalThumbnailImage:function(name,file){var $thumbNail=null;window.URL=window.webkitURL||window.URL;if(file&&window.URL&&window.URL.createObjectURL){var imageType=/image.*/;if(file.type.match(imageType)){var that=this;var title=name+" - "+InlineAttach.Text.fileSize(file.size)+" - "+file.type;var img=document.createElement("img");img.title=title;img.alt=title;img.onload=function(e){var aspectRatio=that.getAspectRatio(100,100,img.width,img.height);img.width=Math.round(img.width/aspectRatio);img.height=Math.round(img.height/aspectRatio);$thumbNail.show();window.URL.revokeObjectURL(img.src)};img.src=window.URL.createObjectURL(file);$thumbNail=jQuery(img).hide()}}return $thumbNail},getAspectRatio:function(maxWidth,maxHeight,origWidth,origHeight){if(origWidth>maxWidth){return Math.round(origWidth/maxWidth)}else{if(origHeight>maxHeight){return Math.round(origHeight/maxHeight)}else{return 1}}},addErrorWithFileName:function(error,fileName,replaceObj){if(error.indexOf(fileName)===-1){error=InlineAttach.Text.tr("upload.error.server",fileName,error)}return this.addError(error,replaceObj)},addError:function(error,replaceObj){var $element=InlineAttach.Renderers.container();$element.addClass("error").append(jQuery("<div>").text(error)).hide();this._replaceElement($element,replaceObj);return $element},clearErrors:function(){this.$form.find("div.error").remove();return this},cloneFileInput:function(){return this.fileSelector.cloneInput()},onCancel:function(callback){var $cancel=this.$form.find("a.cancel");$cancel.click(jQuery.proxy(callback,this));return this},_getFormSubmits:function(){return this.$form.find("input[type=submit]")},_addElement:function(el){this.fileSelector.before(el)},_replaceElement:function($element,replaceObj){if(replaceObj&&replaceObj.$element){replaceObj.$element.replaceWith($element)}else{this._addElement($element)}$element.fadeIn()}});InlineAttach.FormUpload=Class.extend({init:function(options){var scope=options.scope||null;var rescope=InlineAttach.rescope;this.$input=options.$input;this.url=options.url;this.params=options.params||{};this.successcb=rescope(options.success,scope);this.errorcb=rescope(options.error,scope);this.before=rescope(options.before,scope);this.after=rescope(options.after,scope);this.abortcb=rescope(options.abort,scope);this.aborted=false;this.$form=null;this.xhr=null},upload:function(){if(this.aborted){return }var url=this.url;var params=jQuery.param(this.params);if(params){url=url+"?"+params}var $attachForm=this.$form=this._renders.form(url),that=this;this._addToBody($attachForm.append(this.$input));$attachForm.ajaxForm({dataType:"json",data:this.params,timeout:0,beforeSend:function(xhr){that.xhr=xhr},beforeSubmit:function(){that.before()},error:function(xhr){if(that.aborted){that.abortcb()}else{var text=(xhr&&xhr.responseText)||"";that.errorcb(text)}},success:function(data){that.successcb(data||{})},complete:function(){if(that.$form){that.$form.remove();that.$form=null}that.after()}});$attachForm.submit()},abort:function(){if(!this.aborted){this.aborted=true;if(this.xhr){this.xhr.abort();this.xhr=null}else{this.abortcb();this.after()}}},_addToBody:function($form){jQuery("body").append($form)},_renders:{form:function(postUrl){return jQuery("<form method='post' enctype='multipart/form-data'/>").attr("action",postUrl).hide()}}});InlineAttach.AjaxUpload=Class.extend({init:function(options){var scope=options.scope||null;var rescope=InlineAttach.rescope;this.file=options.file;this.url=options.url;this.params=options.params||{};this.beforecb=rescope(options.before,scope);this.progresscb=rescope(options.progress,scope);this.errorcb=rescope(options.error,scope);this.successcb=rescope(options.success,scope);this.abortcb=rescope(options.abort,scope);this.finalcb=rescope(options.after,scope);this.aborted=false},upload:function(){if(this.aborted||this.xhr){return }var xhr=this.xhr=InlineAttach.AjaxUpload.xhr();xhr.upload.onprogress=jQuery.proxy(this._upload,this);xhr.onreadystatechange=jQuery.proxy(this._statechange,this);var url=this.url;var params=jQuery.param(this.params);if(params){url=url+"?"+params}this.beforecb();try{xhr.open("POST",url,true);xhr.setRequestHeader("Content-Type",this.file.type||"application/octet-stream");xhr.send(this.file)}catch(e){this._clienterror(e,this.file)}},abort:function(){if(!this.aborted){this.aborted=true;if(this.xhr){this.xhr.abort()}else{this.abortcb();this.finalcb()}}},_statechange:function(){if(this.xhr.readyState===4){if(this.aborted){this.abortcb()}else{try{this.successcb(JSON.parse(this.xhr.responseText),this.xhr.status,this.xhr)}catch(e){this.errorcb(this.xhr.responseText,this.xhr.status,this.xhr)}this.xhr.upload.onprogress=this.xhr.statechange=null}this.finalcb()}},_clienterror:function(e,file){this.errorcb(InlineAttach.AjaxUpload.getClientErrorMessage(e,file),-1,this.xhr);this.finalcb()},_upload:function(event){if(event.lengthComputable){this.progresscb(event.loaded)}}});jQuery.extend(InlineAttach.AjaxUpload,{isSupported:function(){return InlineAttach.AjaxUpload._fileApiSupport(window)&&InlineAttach.AjaxUpload._xhrSupport()},xhr:function(){var fn=InlineAttach.AjaxUpload._xhrJquery();if(!fn){fn=InlineAttach.AjaxUpload._xhrDirect}InlineAttach.AjaxUpload.xhr=fn;return fn()},getClientErrorMessage:function(e,file){var safeName;try{safeName=file.name}catch(ignored){safeName="<unknown>"}if(e.name==="NS_ERROR_FILE_ACCESS_DENIED"){return InlineAttach.Text.tr("upload.error.no.access",safeName)}else{if(e.name==="NS_ERROR_FILE_NOT_FOUND"||e.name==="NS_ERROR_FILE_TARGET_DOES_NOT_EXIST"){return InlineAttach.Text.tr("upload.error.does.not.exist",safeName)}else{return InlineAttach.Text.tr("upload.error.client.unknown",safeName,e.message||e)}}},_xhrJquery:function(){var settings=jQuery.ajaxSettings;return(settings&&settings.xhr)||null},_xhrDirect:function(){try{return new XMLHttpRequest()}catch(e){return null}},_xhrSupport:function(){try{var xhr=InlineAttach.AjaxUpload.xhr();if(xhr&&xhr.upload){return true}}catch(e){}return false},_fileApiSupport:function(window){return window.File&&window.FileList&&(!Navigator.isMozilla()||window.FileReader)}});InlineAttach.Timer=Class.extend({init:function(callback,scope){this.callback=InlineAttach.rescope(callback,scope||this);this._callback=jQuery.proxy(this._callback,this);this.timeoutId=null},cancel:function(){if(this.timeoutId!==null){this._endTimeout(this.timeoutId);this.timeoutId=null}return this},schedule:function(timeout){this.cancel();this.timeoutId=this._startTimeout(this._callback,timeout);return this},_callback:function(){this.timeoutId=null;this.callback()},_startTimeout:function(fn,timeout){return window.setTimeout(fn,timeout)},_endTimeout:function(id){window.clearTimeout(id)}});InlineAttach.Text=(function(){var kB=1024;var MB=1024*kB;var GB=1024*MB;var bMax=Math.floor(kB*0.995);var kBMax=Math.floor(MB*0.995);var MBMax=Math.floor(GB*0.995);return{"upload.empty.file":AJS.I18n.getText("upload.empty.file"),"upload.too.big":AJS.I18n.getText("upload.too.big"),"upload.error.bad.response":AJS.I18n.getText("upload.error.bad.response"),"upload.error.unknown.status":AJS.I18n.getText("upload.error.unknown.status"),"upload.error.auth":AJS.I18n.getText("upload.error.auth"),"upload.error.badrequest":AJS.I18n.getText("upload.error.badrequest"),"upload.error.server":AJS.I18n.getText("upload.error.server"),"upload.cancel":AJS.I18n.getText("common.words.cancel"),"upload.file.remaining":AJS.I18n.getText("upload.file.remaining"),"upload.file.waiting":AJS.I18n.getText("upload.file.waiting"),"upload.file.stalled":AJS.I18n.getText("upload.file.stalled"),"upload.checkbox.title":AJS.I18n.getText("attachfile.attachment.checkbox.title"),"upload.xsrf.timeout":AJS.I18n.getText("attachment.error.xsrf.expired"),"upload.error.unknown":AJS.I18n.getText("attachment.error.unknown"),"upload.progress.title.waiting":AJS.I18n.getText("upload.progress.title.waiting"),"upload.progress.title.running":AJS.I18n.getText("upload.progress.title.running"),"upload.progress.title.unknown.stalled":AJS.I18n.getText("upload.progress.title.unknown.stalled"),"upload.progress.title.known":AJS.I18n.getText("upload.progress.title.known"),"upload.progress.title.known.stalled":AJS.I18n.getText("upload.progress.title.known.stalled"),"upload.kilobyte":AJS.I18n.getText("upload.kilobyte"),"upload.kilobyte.part":AJS.I18n.getText("upload.kilobyte.part"),"upload.megabyte":AJS.I18n.getText("upload.megabyte"),"upload.megabyte.part":AJS.I18n.getText("upload.megabyte.part"),"upload.gigabyte":AJS.I18n.getText("upload.gigabyte"),"upload.gigabyte.part":AJS.I18n.getText("upload.gigabyte.part"),"upload.seconds":AJS.I18n.getText("upload.seconds"),"upload.minutes":AJS.I18n.getText("upload.minutes"),"upload.hours":AJS.I18n.getText("upload.hours"),"upload.hours.minutes":AJS.I18n.getText("upload.hours.minutes"),"upload.bytes.per.second":AJS.I18n.getText("upload.bytes.per.second"),"upload.kilobytes.per.second":AJS.I18n.getText("upload.kilobytes.per.second"),"upload.megabytes.per.second":AJS.I18n.getText("upload.megabytes.per.second"),"upload.error.no.access":AJS.I18n.getText("upload.error.no.access"),"upload.error.does.not.exist":AJS.I18n.getText("upload.error.does.not.exist"),"upload.error.client.unknown":AJS.I18n.getText("upload.error.client.unknown"),"upload.error.too.many.files":AJS.I18n.getText("upload.error.too.many.files"),"upload.error.server.no.reply":AJS.I18n.getText("upload.error.server.no.reply"),tr:function(key){if(arguments.length===0){return undefined}else{if(arguments.length===1){return this[key]||key}else{if(this[key]){var args=InlineAttach.copyArrayLike(arguments);args[0]=this[key];return AJS.format.apply(AJS,args)}else{return key}}}},fileSize:function(){if(arguments.length===0){return undefined}else{var key,b=InlineAttach.Text._classifySize(arguments[0]);if(b.unit===kB){key="upload.kilobyte"}else{if(b.unit===MB){key="upload.megabyte"}else{key="upload.gigabyte"}}if(arguments.length===1){return this.tr(key,b.convert(arguments[0]))}else{var result=new Array(arguments.length);for(var i=0;i<arguments.length;i++){result[i]=this.tr(key,b.convert(arguments[i]))}return result}}},currentOutOfTotalSize:function(current,total){var b=this._classifySize(total),key;if(b.unit===kB){key="upload.kilobyte.part"}else{if(b.unit===MB){key="upload.megabyte.part"}else{key="upload.gigabyte.part"}}return this.tr(key,b.convert(current),b.convert(total))},_classifySize:function(size){var base;if(size<=kBMax){base=kB}else{if(size<=MBMax){base=MB}else{base=GB}}return{unit:base,convert:function(s){return InlineAttach.Text._toDisplay(s/base)}}},time:function(seconds){if(seconds<60){return this.tr("upload.seconds",Math.floor(seconds))}else{var minutes=seconds/60;if(minutes<60){return this.tr("upload.minutes",Math.floor(minutes))}else{var hours=Math.floor(minutes/60);minutes=Math.floor(minutes%60);if(minutes>0){return this.tr("upload.hours.minutes",hours,minutes)}else{return this.tr("upload.hours",hours)}}}},rate:function(bytesPerSecond){if(bytesPerSecond<=bMax){return this.tr("upload.bytes.per.second",InlineAttach.Text._toDisplay(bytesPerSecond))}else{if(bytesPerSecond<=kBMax){return this.tr("upload.kilobytes.per.second",InlineAttach.Text._toDisplay(bytesPerSecond/kB))}else{return this.tr("upload.megabytes.per.second",InlineAttach.Text._toDisplay(bytesPerSecond/MB))}}},_toDisplay:function(number){if(number<0.005){return"0"}else{return(Math.round(number*100)/100).toFixed(2)}}}})();return InlineAttach});AJS.namespace("AJS.InlineAttach",null,require("jira/attachment/inline-attach"));