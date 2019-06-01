/*global location */
sap.ui.define([
	"z/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"z/model/formatter",
	"sap/viz/ui5/data/FlattenedDataset",
	"sap/viz/ui5/controls/common/feeds/FeedItem"
], function(BaseController, JSONModel, formatter, FlattenedDataset, FeedItem) {
	"use strict";

	return BaseController.extend("z.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sProductId = oEvent.getParameter("arguments").objectId;
			var oDataModel = this.getOwnerComponent().getModel();
			var productDetailsModel = new JSONModel();
			var stockDetailsModel = new JSONModel();
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");
			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);
			var oFilters = [
				new sap.ui.model.Filter("IvDlrNum",
					sap.ui.model.FilterOperator.EQ,
					"3P1326"),
				new sap.ui.model.Filter("IvProductId",
					sap.ui.model.FilterOperator.EQ,
					sProductId)
			];
			var mParameters = {
				filters: oFilters,
				urlParameters: {
					"$expand": "N_STOCK,N_EMERSTOCK"
				},
				success: function(oData) {

					productDetailsModel.setData(oData.results[0].EsProdDetails);
					this.setModel(productDetailsModel, "ProdDetModel");
					var json = {};
					json.items = oData.results[0].N_EMERSTOCK.results;

					stockDetailsModel.setData(json);

					var oVizFrame = this.byId("vizFrameId");
					oVizFrame.setModel(stockDetailsModel, "stockDetModel");
					oVizFrame.setVizProperties({
						title: {
							text: "Stock Information"
						},
						plotArea: {
							colorPalette: "sapUiChartPaletteSequentialHue1Light1"//,
						//	drawingEffect: "glossy"
						}
					});
					var oDataSet = new FlattenedDataset({
						dimensions: [
							new sap.viz.ui5.data.DimensionDefinition({
								name: "Plant",
								value: "{stockDetModel>PlantId}"
							})
						],
						measures: [
							new sap.viz.ui5.data.MeasureDefinition({
								name: "Stock",
								value: "{stockDetModel>StockBalance}"
							})

						],
						data: {
							path: "stockDetModel>/items"
						}
					});
					var oFeedItemValueAxis1 = new FeedItem({
						"uid": "valueAxis",
						"type": "Measure",
						"values": ["Stock"]
					});

					var oFeedItemCategoryAxis = new FeedItem({
						"uid": "categoryAxis",
						"type": "Dimension",
						"values": ["Plant"]
					});
					oVizFrame.destroyFeeds();
					oVizFrame.setDataset(oDataSet);
					oVizFrame.addFeed(oFeedItemValueAxis1);
					oVizFrame.addFeed(oFeedItemCategoryAxis);

				}.bind(this),
				error: function() {

				}
			};
			oDataModel.read("/Product_DetailSet?", mParameters);
			oDataModel.attachRequestSent(function() {
				oViewModel.setProperty("/busy", true);
				//	var json= {};
				//	stockDetailsModel.setData(json);
			});
			oDataModel.attachRequestCompleted(function() {
				oViewModel.setProperty("/busy", false);
			});
			oDataModel.setRefreshAfterChange(true);
			/*	this.getModel().metadataLoaded().then( function() {
					var sObjectPath = this.getModel().createKey("Product_DetailSet", {
						IvDlrNum :  '3P1326',
						IvProductId: sProductId
					});
					this._bindView("/" + sObjectPath);
				}.bind(this));*/
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			//	alert(sObjectPath);
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				urlParameters: {
					"$expand": "Product_DetailSet/N_EMERSTOCK,Product_DetailSet/N_STOCK"
				},
				/*parameters: {
					expand: "Product_DetailSet/N_EMERSTOCK,Product_DetailSet/N_STOCK"	
				},*/
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function(data) {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.ProductGuid,
				sObjectName = oObject.ProductId,
				oViewModel = this.getModel("detailView");
			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		}

	});

});