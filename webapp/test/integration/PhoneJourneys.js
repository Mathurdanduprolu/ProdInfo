jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"z/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"z/test/integration/pages/App",
	"z/test/integration/pages/Browser",
	"z/test/integration/pages/Master",
	"z/test/integration/pages/Detail",
	"z/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "z.view."
	});

	sap.ui.require([
		"z/test/integration/NavigationJourneyPhone",
		"z/test/integration/NotFoundJourneyPhone",
		"z/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});