jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 EtProductSet in the list

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
		"z/test/integration/MasterJourney",
		"z/test/integration/NavigationJourney",
		"z/test/integration/NotFoundJourney",
		"z/test/integration/BusyJourney",
		"z/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});