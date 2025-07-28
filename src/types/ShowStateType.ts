/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

export interface ShowStateType {
	sidebar: boolean;
	routeBox: boolean;
	settings: boolean;
	stylesCard: boolean;
	about: boolean;
	unauthSimulation: boolean;
	unauthSimulationBounds: boolean;
	unauthSimulationExitModal: boolean;
	openFeedbackModal: boolean;
	openSignInModal: boolean;
	// IoT Dashboard features
	iotDevices: boolean;
	iotGeofences: boolean;
	trackerManagement: boolean;
	geofenceManagement: boolean;
	deviceManagement: boolean;
}
