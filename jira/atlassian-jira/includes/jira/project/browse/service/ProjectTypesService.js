define('jira/project/browse/projecttypesservice', function() {
        'use strict';

        return {
            init: function(projectTypes) {
                this.projectTypes = projectTypes;
            },

            areProjectTypesEnabled: function() {
                return !!this.projectTypes;
            },

            getProjectTypeIcon: function(projectTypeKey) {
                if (this.projectTypes) {
                    var projectType = this.projectTypes[projectTypeKey] || this.projectTypes['jira-project-type-inaccessible'];
                    return projectType.icon;
                }
                return null;
            }
        };
    }
);