//When this file is loaded, it will add the markup to the actual shopping website with angular bindings
(function() {
    $('body').prepend("\
        <div ng-app='irma-extension' ng-csp id='irma-extension' ng-controller='IrmaExtensionCtrl' ng-cloak>\
            <sliding-tab tab-header='List: {{listTitleDisplay}}' side='right' tab-expanded='tabExpanded'>\
                <div class='loading-overlay' ng-show='numPending > 0'><div class='loading'></div></div>\
                <div class='irma-ext' name='irmaExt' ng-form ng-submit='loadListData()' ng-hide='listLoaded'>\
                    <label for='user'>User name</label>\
                    <input id='user' type='text' ng-model='credentials.userName' required placeholder='User name' autofocus/>\
                    <label for='pass'>Password</label>\
                    <input id='pass' type='password' ng-model='credentials.password' required placeholder='Password'/>\
                    <button type='button' ng-click='loadListData()' class='btn' ng-disabled='!irmaExt.$valid'>Load</button>\
                    <div ng-show='errorMessage && errorMessage.length > 0'>{{errorMessage}}</div>\
                </div>\
                <div ng-show='listLoaded' >\
                    <a ng-click='loadListData(true)' class='smallText extLnk'>Reload</a>\
                    <a ng-click='logout()' class='smallText extLnk'>Log Out</a>\
                    <ul id='ext-list'>\
                        <li ng-repeat='item in list.items'>\
                            <input type='checkbox' ng-model='item.checked' ng-change='itemCheckStatusChanged(item)' />\
                            <a href='#' ng-click='searchText(item.text)'>{{item.text}}</a>\
                        </li>\
                    </ul>\
                </div>\
            </sliding-tab>\
        </div>\
    ");
})();
// Also use jquery to do something that should have been easy with angular, but wasn't
$(function() {
    $('.irma-ext').on('keydown', 'input', function(e) {
        if(e.keyCode != 13) return;
        $(this).next('button').click();
    });
});