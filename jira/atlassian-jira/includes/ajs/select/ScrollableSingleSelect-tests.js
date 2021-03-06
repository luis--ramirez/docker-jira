AJS.test.require(["jira.webresources:select-pickers"], function() {

    require([
        'jira/ajs/select/scrollable-single-select',
        'jquery',
        'underscore'
    ],
    function(
        ScrollableSingleSelect,
        jQuery,
        _
    ) {
        module("ScrollableSingleSelect",{
            setup: function() {
                /**
                 * @param items
                 * @returns {jQuery}
                 */
                this.selectBuilder = function(items) {
                    var $select = jQuery('<select></select>').attr('id','selectTest');
                    var $group;

                    $group = jQuery('<optgroup></optgroup>').attr('label','Group');
                    for (var i=1;i<=items;i++) {
                        $group.append('<option value="'+i+'">'+i+'</option>').attr('selected',false);
                    }
                    $select.append($group);
                    return $select;
                };

                this.inlineLayerMock = {
                    show:jQuery.noop,
                    hide:jQuery.noop,
                    setWidth:jQuery.noop,
                    setPosition:jQuery.noop,
                    $layer: jQuery('<div></div>').css({'max-height':'100px','overflow':'scroll'})
                            .append(jQuery('<div></div>').css('height','1000px')),
                    scroll: function(scrollPercent) {
                        this.$layer[0].scrollTop = scrollPercent*this.$layer[0].scrollHeight/100;
                        this.$layer.trigger('scroll');
                    },
                    resizeLayer: function(height) {
                        this.$layer.children().css('height',height+'px');
                    }

                };
                this.inlineLayerMock.$layer.appendTo(jQuery('#qunit-fixture'));

            }
        });

        test("it should properly fetch new results when scroll treshold is met",function() {
            var $element = this.selectBuilder(20).appendTo('#qunit-fixture');
            var select = new ScrollableSingleSelect({
                    element: $element,
                    pageSize: 5,
                    newResultsThreshold: 50
                });

            select.dropdownController = this.inlineLayerMock;
            select._assignEventsToFurniture(); //manually assign event handlers after mock inject
            sinon.spy(select.listController, "generateListFromJSON");
            sinon.spy(select,'_fetchNewContent');
            sinon.spy(select.listController,"addNextPage");

            select._handleCharacterInput(true);
            ok(select.listController.generateListFromJSON.calledOnce,'rendered first page');
            this.inlineLayerMock.scroll(20);
            ok(select.listController.generateListFromJSON.calledOnce,'did not render whole list on scroll');
            equal(select._fetchNewContent.callCount,0,'did not triggered page add before meeting threshold');
            this.inlineLayerMock.scroll(50);
            ok(select._fetchNewContent.calledOnce,'started fetching content upon meeting threshold');
            this.inlineLayerMock.scroll(50);
            ok(select._fetchNewContent.calledOnce,'fetching content is run asynchronously');
            this.inlineLayerMock.resizeLayer(1500);
            stop();
            //since JS is single-threaded we have to postpone next scroll event, so that addNextPage promise will be resolved.
            _.defer(function() {
                this.inlineLayerMock.scroll(50);
                ok(select._fetchNewContent.calledTwice,'started fetching second page of results');
                ok(select.listController.addNextPage.calledOnce,'rendered first page of results');
                start();
            }.bind(this));
        });

        test('it should display error message when failed to fetch next page',function() {
            var $element = this.selectBuilder(2).appendTo('#qunit-fixture');
            var select = new ScrollableSingleSelect({
                element: $element,
                pageSize: 2
            });

            select.dropdownController = this.inlineLayerMock;
            select._assignEventsToFurniture(); //manually assign event handlers after mock inject
            sinon.spy(select.listController,'showPageRenderError');
            sinon.stub(select.listController,'addNextPage')['throws']();

            select._handleCharacterInput(true);
            this.inlineLayerMock.scroll(90);
            stop();
            _.defer(function() {
                ok(select.listController.showPageRenderError.calledOnce,'called error footer rendering');
                start();
            });
        });

        test('it should properly filter and paginate results based on user query',function() {
            var $element = this.selectBuilder(20).appendTo('#qunit-fixture');
            var select = new ScrollableSingleSelect({
                element: $element,
                pageSize: 2
            });

            select.dropdownController = this.inlineLayerMock;
            select._assignEventsToFurniture(); //manually assign event handlers after mock inject

            sinon.spy(select.listController, "generateListFromJSON");
            sinon.spy(select.listController,"addNextPage");

            stop();
            setTimeout(function() { //event handlers are assigned after timeout {@see QueryableDropdownSelect}
                select.$field.val('a');
                select.$field.trigger('input');
                ok(select.listController.generateListFromJSON.calledOnce,'key input opens dropdown');
                start();

                this.inlineLayerMock.scroll(90);
                stop();
                _.defer(function() {
                    ok(select.listController.addNextPage.calledOnce,'query does not interfere with pagination');
                    start();
                });
            }.bind(this),20);

        });
    });
});
