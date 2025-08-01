/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { FC, MutableRefObject, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { decodeToLineStringFeature } from "@aws/polyline";
import { Flex, View } from "@aws-amplify/ui-react";
import { IconLocateMe, LogoDark, LogoLight } from "@demo/assets/svgs";
import { SearchBox } from "@demo/atomicui/organisms/SearchBox";
import { appConfig } from "@demo/core/constants";
import {
  useAuthManager,
  useMap,
  useMapManager,
  usePersistedData,
  usePlace,
  useRecordViewPage,
  useRoute
} from "@demo/hooks";
import useBottomSheet from "@demo/hooks/useBottomSheet";
import useDeviceMediaQuery from "@demo/hooks/useDeviceMediaQuery";
import { ShowStateType } from "@demo/types";
import { MapColorSchemeEnum, ResponsiveUIEnum, TriggeredByEnum } from "@demo/types/Enums";
import { getBoundsFromLineString } from "@demo/utils";
import { errorHandler } from "@demo/utils/errorHandler";
import { LineString } from "@turf/turf";
import type { GeolocateControl as GeolocateControlRef } from "maplibre-gl";
import { useTranslation } from "react-i18next";
import {
  AttributionControl,
  GeolocateControl,
  LngLatBoundsLike,
  Map,
  MapRef,
  NavigationControl
} from "react-map-gl/maplibre";
import { RefHandles } from "react-spring-bottom-sheet/dist/types";
import "maplibre-gl/dist/maplibre-gl.css";
import "./styles.scss";

const DemoPlaceholderPage = lazy(() =>
  import("@demo/atomicui/pages/DemoPlaceholderPage").then(module => ({
    default: module.DemoPlaceholderPage
  }))
);
const WelcomeModal = lazy(() =>
  import("@demo/atomicui/molecules/WelcomeModal").then(module => ({
    default: module.WelcomeModal
  }))
);
const MapButtons = lazy(() =>
  import("@demo/atomicui/molecules/MapButtons").then(module => ({
    default: module.MapButtons
  }))
);
const Sidebar = lazy(() =>
  import("@demo/atomicui/organisms/Sidebar").then(module => ({
    default: module.Sidebar
  }))
);
const RouteBox = lazy(() =>
  import("@demo/atomicui/organisms/RouteBox").then(module => ({
    default: module.RouteBox
  }))
);
const UnauthSimulation = lazy(() =>
  import("@demo/atomicui/organisms/UnauthSimulation").then(module => ({
    default: module.UnauthSimulation
  }))
);
const ResponsiveBottomSheet = lazy(() =>
  import("@demo/atomicui/organisms/ResponsiveBottomSheet").then(module => ({
    default: module.ResponsiveBottomSheet
  }))
);
const SettingsModal = lazy(() =>
  import("@demo/atomicui/organisms/SettingsModal").then(module => ({
    default: module.SettingsModal
  }))
);
const AboutModal = lazy(() =>
  import("@demo/atomicui/organisms/AboutModal").then(module => ({
    default: module.AboutModal
  }))
);
const FeedbackModal = lazy(() =>
  import("@demo/atomicui/molecules/FeedbackModal").then(module => ({
    default: module.FeedbackModal
  }))
);
const SignInModal = lazy(() =>
  import("@demo/atomicui/molecules/SignInModal").then(module => ({
    default: module.SignInModal
  }))
);
const UnauthSimulationExitModal = lazy(() =>
  import("@demo/atomicui/molecules/ConfirmationModal").then(module => ({
    default: module.ConfirmationModal
  }))
);
const IoTDevices = lazy(() =>
  import("@demo/atomicui/organisms/IoTDevices").then(module => ({
    default: module.IoTDevices
  }))
);
const IoTGeofences = lazy(() =>
  import("@demo/atomicui/organisms/IoTGeofences").then(module => ({
    default: module.IoTGeofences
  }))
);
const TrackerManagement = lazy(() =>
  import("@demo/atomicui/organisms/TrackerManagement").then(module => ({
    default: module.TrackerManagement
  }))
);
const GeofenceManagement = lazy(() =>
  import("@demo/atomicui/organisms/GeofenceManagement").then(module => ({
    default: module.GeofenceManagement
  }))
);
const DeviceManagement = lazy(() =>
  import("@demo/atomicui/organisms/DeviceManagement").then(module => ({
    default: module.DeviceManagement
  }))
);

const {
  MAP_RESOURCES: { MAX_BOUNDS, SEARCH_ROUTE_BOUND_OPTIONS },
  LINKS: { AWS_LOCATION },
  ROUTES: { DEMO }
} = appConfig;
const initShow: ShowStateType = {
		sidebar: false,
		routeBox: false,
		settings: false,
		stylesCard: false,
		about: false,
		unauthSimulation: false,
		unauthSimulationBounds: false,
		unauthSimulationExitModal: false,
		openFeedbackModal: false,
		openSignInModal: false,
			// IoT Dashboard features
	iotDevices: false,
	iotGeofences: false,
	trackerManagement: false,
	geofenceManagement: false,
	deviceManagement: false
	};

const DemoPage: FC = () => {
  useRecordViewPage("DemoPage");
  const [show, setShow] = useState<ShowStateType>(initShow);
  const [isUnauthNotifications, setUnauthIsNotifications] = useState(false);
  const [confirmCloseUnauthSimulation, setConfirmCloseUnauthSimulation] = useState(false);
  const [expandRouteOptionsMobile, setExpandRouteOptionsMobile] = useState(false);
  const [startSimulation, setStartSimulation] = useState(false);
  const [searchBoxValue, setSearchBoxValue] = useState("");
  const mapRef = useRef<MapRef | null>(null);
  const geolocateControlRef = useRef<GeolocateControlRef | null>(null);
  const { currentLocationData, viewpoint, mapColorScheme, setBiasPosition } = useMap();
  const { zoom, setZoom } = usePlace();
  const { routeData, directions } = useRoute();
  const { showWelcomeModal, setShowWelcomeModal, setSettingsOptions } = usePersistedData();
  const { isDesktop, isMobile, isTablet, isMax766 } = useDeviceMediaQuery();
  const { ui, bottomSheetCurrentHeight = 0 } = useBottomSheet();
  useAuthManager();
  const {
    mapStyleWithLanguageUrl,
    gridLoader,
    setGridLoader,
    onLoad,
    getCurrentGeoLocation,
    onGeoLocate,
    onGeoLocateError,
    handleMapClick,
    resetAppState
  } = useMapManager({
    mapRef,
    geolocateControlRef,
    isUnauthSimulationOpen: show.unauthSimulation,
    isSettingsOpen: show.settings,
    isRouteBoxOpen: show.routeBox,
    resetAppStateCb: () => setShow(s => ({ ...initShow, stylesCard: s.stylesCard, settings: s.settings }))
  });
  const { t } = useTranslation();
  const geoLocateTopValue = `${bottomSheetCurrentHeight / 13 + 0.59}rem`;

  const handlePopState = () => {
    if (isMax766 && window.location.pathname === DEMO) {
      history.go();
    }
  };

  useEffect(() => {
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let previousWidth = document.body.clientWidth;

    const resizeObserver = new ResizeObserver(() => {
      const currentWidth = document.body.clientWidth;

      if ((previousWidth < 1024 && currentWidth >= 1024) || (previousWidth >= 1024 && currentWidth < 1024)) {
        window.location.reload();
      }

      previousWidth = currentWidth;
    });

    const handleWindowResize = () => {
      resizeObserver.observe(document.body);
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      resizeObserver.disconnect();
    };
  }, []);

  // TODO: move to useRouteManager
  useEffect(() => {
    if ((show.routeBox || ui === ResponsiveUIEnum.routes) && routeData?.Routes![0]?.Legs) {
      const options = isDesktop
        ? SEARCH_ROUTE_BOUND_OPTIONS.DESKTOP
        : isTablet
        ? SEARCH_ROUTE_BOUND_OPTIONS.TABLET
        : SEARCH_ROUTE_BOUND_OPTIONS.MOBILE;
      const ls: number[][] = [];

      routeData.Routes[0].Legs.forEach(({ Geometry }) => {
        if (Geometry?.Polyline) {
          const decodedGeoJSON = decodeToLineStringFeature(Geometry?.Polyline);
          const g = decodedGeoJSON.geometry as LineString;
          ls.push(...g.coordinates);
        }

        if (Geometry?.LineString) {
          Geometry.LineString.length > 0 && ls.push(...Geometry.LineString);
        }
      });

      const bounds = getBoundsFromLineString(ls);
      bounds && mapRef.current?.fitBounds(bounds as [number, number, number, number], options);
    }
  }, [isDesktop, isTablet, routeData, show.routeBox, ui]);

  // TODO: move to useRouteManager
  useEffect(() => {
    if (directions) setShow(s => ({ ...s, routeBox: true }));
  }, [directions, show]);

  const locationError = useMemo(() => !!currentLocationData?.error, [currentLocationData]);

  const searchBoxEl = useCallback(
    (isSimpleSearch = false, bottomSheetRef?: MutableRefObject<RefHandles | null>) => (
      <SearchBox
        mapRef={mapRef}
        value={searchBoxValue}
        setValue={setSearchBoxValue}
        isSideMenuExpanded={show.sidebar}
        onToggleSideMenu={() => setShow(s => ({ ...s, sidebar: !s.sidebar }))}
        setShowRouteBox={b => setShow(s => ({ ...s, routeBox: b }))}
        isRouteBoxOpen={show.routeBox}
        isSettingsOpen={show.settings}
        isStylesCardOpen={show.stylesCard}
        isSimpleSearch={isSimpleSearch}
        bottomSheetRef={bottomSheetRef}
      />
    ),
    [searchBoxValue, setSearchBoxValue, show.routeBox, show.settings, show.sidebar, show.stylesCard]
  );

  const _GeolocateControl = useMemo(
    () => (
      <>
        <Flex
          style={{
            display: locationError ? "flex" : "none",
            bottom: isMobile ? `${(bottomSheetCurrentHeight || 0) / 13 + 1.2}rem` : isDesktop ? "9.9rem" : "2rem",
            right: isMobile ? "1rem" : isDesktop ? "2rem" : "2rem"
          }}
          className="location-disabled"
          onClick={() => getCurrentGeoLocation()}
        >
          <IconLocateMe />
        </Flex>
        <GeolocateControl
          ref={geolocateControlRef}
          style={{
            bottom: isMobile ? geoLocateTopValue : isDesktop ? "9.05rem" : "0.55rem",
            right: isMobile ? "0.18rem" : isDesktop ? "1.19rem" : "0.5rem",
            display: show.unauthSimulationBounds || locationError ? "none" : "flex"
          }}
          position="bottom-right"
          positionOptions={{ enableHighAccuracy: true }}
          showUserLocation
          showAccuracyCircle={true}
          onGeolocate={onGeoLocate}
          onError={onGeoLocateError}
        />
      </>
    ),
    [
      locationError,
      isMobile,
      bottomSheetCurrentHeight,
      isDesktop,
      geoLocateTopValue,
      onGeoLocate,
      onGeoLocateError,
      getCurrentGeoLocation,
      show.unauthSimulationBounds
    ]
  );

  const UnauthSimulationUI = useMemo(
    () => (
      <UnauthSimulation
        mapRef={mapRef}
        setShowUnauthSimulation={b => setShow(s => ({ ...s, unauthSimulation: b }))}
        startSimulation={startSimulation}
        setStartSimulation={setStartSimulation}
        setShowUnauthSimulationBounds={b => setShow(s => ({ ...s, unauthSimulationBounds: b }))}
        isNotifications={isUnauthNotifications}
        setIsNotifications={setUnauthIsNotifications}
        confirmCloseSimulation={confirmCloseUnauthSimulation}
        setConfirmCloseSimulation={setConfirmCloseUnauthSimulation}
        geolocateControlRef={geolocateControlRef}
      />
    ),
    [confirmCloseUnauthSimulation, isUnauthNotifications, startSimulation]
  );

  const handleLogoClick = () => window.open(AWS_LOCATION, "_self");

  const handleSignIn = () => {
    // SignInModal handles authentication internally
    // This callback is called after successful sign-in
    console.log("✅ User signed in successfully");
    
    // Close the modal on success
    setShow(s => ({ ...s, openSignInModal: false }));
  };

  return mapStyleWithLanguageUrl ? (
    <View
      style={{ height: "100%" }}
      className={`${mapColorScheme === MapColorSchemeEnum.DARK ? "dark-mode" : "light-mode"}`}
    >
      <Map
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
        maxTileCacheSize={100}
        zoom={zoom}
        initialViewState={
          currentLocationData?.currentLocation
            ? { ...currentLocationData.currentLocation, zoom }
            : { ...viewpoint, zoom }
        }
        mapStyle={mapStyleWithLanguageUrl}
        minZoom={2}
        maxBounds={
          show.unauthSimulation && show.unauthSimulationBounds
            ? isDesktop
              ? (MAX_BOUNDS.VANCOUVER.DESKTOP as LngLatBoundsLike)
              : isTablet
              ? (MAX_BOUNDS.VANCOUVER.TABLET as LngLatBoundsLike)
              : (MAX_BOUNDS.VANCOUVER.MOBILE as LngLatBoundsLike)
            : undefined
        }
        onClick={handleMapClick}
        onLoad={onLoad}
        onZoom={({ viewState }) => setZoom(viewState.zoom)}
        onZoomEnd={({ viewState }) => {
          setBiasPosition([viewState.longitude, viewState.latitude]);
        }}
        onDragEnd={({ viewState }) => {
          setBiasPosition([viewState.longitude, viewState.latitude]);
        }}
        onError={error => errorHandler(error.error)}
        onIdle={() => gridLoader && setGridLoader(false)}
        attributionControl={false}
      >
        <View className={gridLoader ? "loader-container" : ""}>
          {isDesktop && (
            <>
              {show.sidebar && (
                <Sidebar
                  onCloseSidebar={() => setShow(s => ({ ...s, sidebar: false }))}
                  onShowSettings={() => setShow(s => ({ ...s, settings: true }))}
                  onShowAboutModal={() => setShow(s => ({ ...s, about: true }))}
                  onShowUnauthSimulation={() => setShow(s => ({ ...s, unauthSimulation: true }))}
                  onOpenSignInModal={() => setShow(s => ({ ...s, openSignInModal: true }))}
                  onShowIoTDevices={() => setShow(s => ({ ...s, deviceManagement: true }))}
                  onShowIoTGeofences={() => setShow(s => ({ ...s, geofenceManagement: true }))}
                  onShowTrackerManagement={() => setShow(s => ({ ...s, trackerManagement: true }))}
                />
              )}
              {show.routeBox ? (
                <RouteBox
                  mapRef={mapRef}
                  setShowRouteBox={b => setShow(s => ({ ...s, routeBox: b }))}
                  isSideMenuExpanded={show.sidebar}
                />
              ) : show.unauthSimulation ? (
                UnauthSimulationUI
              ) : (
                searchBoxEl()
              )}
            </>
          )}
          {!isDesktop && (
            <ResponsiveBottomSheet
              SearchBoxEl={(ref?: MutableRefObject<RefHandles | null>) => searchBoxEl(true, ref)}
              MapButtons={() => (
                <MapButtons
                  renderedUpon={TriggeredByEnum.SETTINGS_MODAL}
                  openStylesCard={show.stylesCard}
                  setOpenStylesCard={b => setShow(s => ({ ...s, stylesCard: b }))}
                  onCloseSidebar={() => setShow(s => ({ ...s, sidebar: false }))}
                  onShowGridLoader={() => setShow(s => ({ ...s, gridLoader: true }))}
                  isUnauthSimulationOpen={show.unauthSimulation}
                  onSetShowUnauthSimulation={(b: boolean) => setShow(s => ({ ...s, unauthSimulation: b }))}
                  onlyMapStyles
                  isHandDevice
                />
              )}
              mapRef={mapRef}
              RouteBox={(ref?: MutableRefObject<RefHandles | null>) => (
                <RouteBox
                  mapRef={mapRef}
                  setShowRouteBox={b => setShow(s => ({ ...s, routeBox: b }))}
                  isSideMenuExpanded={show.sidebar}
                  isDirection={ui === ResponsiveUIEnum.direction_to_routes}
                  expandRouteOptionsMobile={expandRouteOptionsMobile}
                  setExpandRouteOptionsMobile={setExpandRouteOptionsMobile}
                  bottomSheetRef={ref}
                />
              )}
              onCloseSidebar={() => setShow(s => ({ ...s, sidebar: false }))}
              onShowSettings={() => {
                setShow(s => ({ ...s, settings: true }));
                isMobile && setSettingsOptions(undefined);
              }}
              onShowAboutModal={() => setShow(s => ({ ...s, about: true }))}
              onShowUnauthSimulation={() => setShow(s => ({ ...s, unauthSimulation: true }))}
              setShowUnauthSimulation={b => setShow(s => ({ ...s, unauthSimulation: b }))}
              setShow={setShow}
              handleLogoClick={handleLogoClick}
              startSimulation={startSimulation}
              setStartSimulation={setStartSimulation}
              isNotifications={isUnauthNotifications}
              setIsNotifications={setUnauthIsNotifications}
              confirmCloseSimulation={confirmCloseUnauthSimulation}
              setConfirmCloseSimulation={setConfirmCloseUnauthSimulation}
              setShowRouteBox={b => setShow(s => ({ ...s, routeBox: b }))}
              isExpandRouteOptionsMobile={expandRouteOptionsMobile}
              setExpandRouteOptionsMobile={setExpandRouteOptionsMobile}
              setSearchBoxValue={setSearchBoxValue}
              onOpenFeedbackModal={() => setShow(s => ({ ...s, openFeedbackModal: true }))}
              onOpenSignInModal={() => setShow(s => ({ ...s, openSignInModal: true }))}
              onShowIoTDevices={() => setShow(s => ({ ...s, deviceManagement: true }))}
              onShowIoTGeofences={() => setShow(s => ({ ...s, geofenceManagement: true }))}
              onShowTrackerManagement={() => setShow(s => ({ ...s, trackerManagement: true }))}
              geolocateControlRef={geolocateControlRef}
              setShowUnauthSimulationBounds={b => setShow(s => ({ ...s, unauthSimulationBounds: b }))}
            />
          )}
          {isDesktop && (
            <MapButtons
              renderedUpon={TriggeredByEnum.DEMO_PAGE}
              openStylesCard={show.stylesCard}
              setOpenStylesCard={b => setShow(s => ({ ...s, stylesCard: b }))}
              onCloseSidebar={() => setShow(s => ({ ...s, sidebar: false }))}
              onShowGridLoader={() => setShow(s => ({ ...s, gridLoader: true }))}
              isUnauthSimulationOpen={show.unauthSimulation}
              onSetShowUnauthSimulation={(b: boolean) => setShow(s => ({ ...s, unauthSimulation: b }))}
            />
          )}
          {isDesktop && <NavigationControl position="bottom-right" showZoom showCompass={false} />}
          {_GeolocateControl}
        </View>
        <AttributionControl
          style={
            isDesktop
              ? {
                  color: mapColorScheme === MapColorSchemeEnum.DARK ? "var(--white-color)" : "var(--black-color)",
                  backgroundColor:
                    mapColorScheme === MapColorSchemeEnum.DARK ? "rgba(0, 0, 0, 0.2)" : "var(--white-color)"
                }
              : { display: "none" }
          }
          compact={true}
        />
      </Map>
      <WelcomeModal open={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} />
      <FeedbackModal open={show.openFeedbackModal} onClose={() => setShow(s => ({ ...s, openFeedbackModal: false }))} />
      <SignInModal 
        open={show.openSignInModal} 
        onClose={() => setShow(s => ({ ...s, openSignInModal: false }))} 
        onSignIn={handleSignIn}
      />
      
      {/* IoT Management UIs */}
      {show.iotDevices && (
        <IoTDevices onClose={() => setShow(s => ({ ...s, iotDevices: false }))} />
      )}
      {show.iotGeofences && (
        <IoTGeofences onClose={() => setShow(s => ({ ...s, iotGeofences: false }))} />
      )}
      {show.trackerManagement && (
        <TrackerManagement 
          onClose={() => setShow(s => ({ ...s, trackerManagement: false }))} 
          onOpenSignInModal={() => setShow(s => ({ ...s, openSignInModal: true }))}
        />
      )}
      {show.geofenceManagement && (
        <GeofenceManagement 
          onClose={() => setShow(s => ({ ...s, geofenceManagement: false }))} 
          onOpenSignInModal={() => setShow(s => ({ ...s, openSignInModal: true }))}
        />
      )}
      {show.deviceManagement && (
        <DeviceManagement 
          onClose={() => setShow(s => ({ ...s, deviceManagement: false }))} 
          onOpenSignInModal={() => setShow(s => ({ ...s, openSignInModal: true }))}
        />
      )}
      
      <SettingsModal
        open={show.settings}
        onClose={() => {
          setShow(s => ({ ...s, settings: false }));
        }}
        resetAppState={resetAppState}
        mapButtons={
          <MapButtons
            renderedUpon={TriggeredByEnum.SETTINGS_MODAL}
            openStylesCard={show.stylesCard}
            setOpenStylesCard={b => setShow(s => ({ ...s, stylesCard: b }))}
            onCloseSidebar={() => setShow(s => ({ ...s, sidebar: false }))}
            onShowGridLoader={() => setGridLoader(true)}
            onlyMapStyles
            isSettingsModal
            isUnauthSimulationOpen={show.unauthSimulation}
            onSetShowUnauthSimulation={(b: boolean) => setShow(s => ({ ...s, unauthSimulation: b }))}
          />
        }
      />
      <AboutModal open={show.about} onClose={() => setShow(s => ({ ...s, about: false }))} />
      <UnauthSimulationExitModal
        open={show.unauthSimulationExitModal}
        onClose={() => setShow(s => ({ ...s, unauthSimulationExitModal: false }))}
        heading={t("start_unauth_simulation__exit_simulation.text")}
        description={t("start_unauth_simulation__exit_modal_desc.text")}
        confirmationText={t("start_unauth_simulation__exit_simulation.text")}
        onConfirm={() => {
          setShow(s => ({
            ...s,
            unauthSimulationExitModal: false,
            unauthGeofenceBox: false,
            unauthTrackerBox: false
          }));
        }}
        cancelationText={t("start_unauth_simulation__stay_in_simulation.text")}
      />
      {(isDesktop || isTablet) && (
        <Flex
          className={`logo-stroke-container ${isTablet ? "logo-stroke-container-tablet" : ""}`}
          onClick={handleLogoClick}
        >
          {mapColorScheme === MapColorSchemeEnum.DARK ? <LogoDark /> : <LogoLight />}
        </Flex>
      )}
    </View>
  ) : (
    <DemoPlaceholderPage value={searchBoxValue} setValue={setSearchBoxValue} show={show} />
  );
};

export default DemoPage;
