require(['jira/page/atl/prefetch', 'jquery'], function executePrefetch(resourcePrefetch, $) {
    $(window).on('load', resourcePrefetch.prefetchViewIssueResources.bind(resourcePrefetch));
});
