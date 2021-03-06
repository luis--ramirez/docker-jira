define('jira/project/browse/projecttypestabsview',
    ['backbone',
     'jquery'],
    function(Backbone,
             $) {
        'use strict';

        return Backbone.Marionette.ItemView.extend({
            template: JIRA.Templates.Project.Browse.projectTypesTabs,
            events: {
                'click a' : function projectTypeClick(e) {
                    var $link = $(e.currentTarget);
                    var id = $link.attr('rel');

                    e.preventDefault();
                    this.trigger('project-type-change',id);
                }
            },
            collectionEvents: {
                'change': 'render'
            },
            onRender: function onRender() {
                this.unwrapTemplate();
            }
        });
    }
);