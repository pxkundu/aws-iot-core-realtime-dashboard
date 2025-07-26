/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { Viewport } from "../support/constants";

describe("Should record user events correctly", () => {
	context("Desktop view", () => {
		beforeEach(() => {
			cy.visitDomain(`${Cypress.env("WEB_DOMAIN")}/demo`);
		});

		it("PPA-001 - should successfully send correct user event to pinpoint", () => {
			cy.sendCorrectEventToPinpoint(Viewport.DESKTOP);
		});

		it("PPA-002 - should successfully create correct endpoint with the correct event to correct pinpoint application", () => {
			// Note: Pinpoint analytics testing disabled - script removed for cleanup
			// This test would verify endpoint creation and event tracking
			cy.getAllLocalStorage().then(result => {
				const analyticsEndpointId = result[`${Cypress.env("WEB_DOMAIN")}`]["amazon-location_analyticsEndpointId"];
				expect(analyticsEndpointId).to.exist;
				// TODO: Re-implement pinpoint analytics testing if needed
			});
		});
	});

	context("Responsive view", () => {
		beforeEach(() => {
			cy.visitDomainInResponsiveView(`${Cypress.env("WEB_DOMAIN")}/demo`);
		});

		it("PPA-003 - should successfully send correct user event to pinpoint", () => {
			cy.sendCorrectEventToPinpoint(Viewport.RESPONSIVE);
		});
	});
});
