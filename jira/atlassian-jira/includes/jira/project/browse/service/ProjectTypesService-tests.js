AJS.test.require("jira.webresources:browseprojects", function() {
    require([
        "jira/project/browse/projecttypesservice"
    ], function (
        ProjectTypesService
    ) {
        module("jira/project/browse/projecttypesservice", {
            setup: function () {
                ProjectTypesService.init(null);
            },

            initServiceWithProjectType: function(projectTypeKey, projectTypeIcon) {
                var projectTypes = {};
                projectTypes[projectTypeKey] = { icon: projectTypeIcon };
                projectTypes["jira-project-type-inaccessible"] = { icon: "inaccessible-type-icon" };
                ProjectTypesService.init(projectTypes);
            }
        });

        test("Indicates that project types is not enabled when it is not initialized", function() {
            equal(ProjectTypesService.areProjectTypesEnabled(), false);
        });

        test("Indicates that project types is not enabled when it is initialized with a valid object", function() {
            ProjectTypesService.init(null);
            equal(ProjectTypesService.areProjectTypesEnabled(), false);

            ProjectTypesService.init(undefined);
            equal(ProjectTypesService.areProjectTypesEnabled(), false);

            ProjectTypesService.init(0);
            equal(ProjectTypesService.areProjectTypesEnabled(), false);

            ProjectTypesService.init(false);
            equal(ProjectTypesService.areProjectTypesEnabled(), false);
        });

        test("Indicates that project types are enabled when it is initialized with an object containing the project types", function() {
            this.initServiceWithProjectType("business", "business-icon");

            equal(ProjectTypesService.areProjectTypesEnabled(), true);
        });

        test("Returned icon is null when project types are disabled", function() {
            var icon = ProjectTypesService.getProjectTypeIcon("business");

            strictEqual(icon, null);
        });

        test("Returned icon is the one for inaccessible project type if type is unknown", function() {
            this.initServiceWithProjectType("business", "business-icon");

            var icon = ProjectTypesService.getProjectTypeIcon("unknown-type");

            equal(icon, "inaccessible-type-icon");
        });

        test("Returned icon is the expected one for a project type that is known", function() {
            this.initServiceWithProjectType("business", "business-icon");

            var icon = ProjectTypesService.getProjectTypeIcon("business");

            equal(icon, "business-icon");
        });
    });
});