/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { ChangeEvent, FC, FormEvent, MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Autocomplete, Badge, Button, Flex, Placeholder, Text, View } from "@aws-amplify/ui-react";
import { IconActionMenu, IconClose, IconDirections } from "@demo/assets/svgs";
import { NLSearchLoader } from "@demo/atomicui/atoms";
import { InputField, Marker, NotFoundCard, SuggestionMarker } from "@demo/atomicui/molecules";
import { appConfig } from "@demo/core/constants";
import BottomSheetHeights from "@demo/core/constants/bottomSheetHeights";
import { useMap, usePlace } from "@demo/hooks";
import useBottomSheet from "@demo/hooks/useBottomSheet";
import useDeviceMediaQuery from "@demo/hooks/useDeviceMediaQuery";
import { DistanceUnitEnum, MapUnitEnum, SuggestionType } from "@demo/types";
import { AnalyticsEventActionsEnum, ResponsiveUIEnum, TriggeredByEnum } from "@demo/types/Enums";
import { getBoundsFromLineString } from "@demo/utils";
import { calculateGeodesicDistance } from "@demo/utils/geoCalculation";
import { Position, Units } from "@turf/turf";
import { isAndroid, isIOS } from "react-device-detect";
import { useTranslation } from "react-i18next";
import { LngLat, MapRef } from "react-map-gl/maplibre";
import { RefHandles } from "react-spring-bottom-sheet/dist/types";
import { Tooltip } from "react-tooltip";
import "./styles.scss";

const { METRIC } = MapUnitEnum;
const { KILOMETERS, MILES } = DistanceUnitEnum;
const nlLoadText = [
  "nl_loader_sample_text_1.text",
  "nl_loader_sample_text_2.text",
  "nl_loader_sample_text_3.text",
  "nl_loader_sample_text_4.text",
  "nl_loader_sample_text_5.text"
];

const {
  // ENV: { NL_BASE_URL, NL_API_KEY },
  // GET_PARAMS: { NL_TOGGLE },
  MAP_RESOURCES: { SEARCH_ROUTE_BOUND_OPTIONS }
} = appConfig;

type OptionType = {
  id: string;
  queryid?: string;
  placeid?: string;
  position?: string;
  label: string;
  address?: string;
  country?: string;
  region?: string;
};

interface SearchBoxProps {
  mapRef: MutableRefObject<MapRef | null>;
  value: string;
  setValue: (value: string) => void;
  isSideMenuExpanded: boolean;
  onToggleSideMenu: () => void;
  setShowRouteBox: (b: boolean) => void;
  isRouteBoxOpen: boolean;
  isSettingsOpen: boolean;
  isStylesCardOpen: boolean;
  isSimpleSearch?: boolean;
  bottomSheetRef?: MutableRefObject<RefHandles | null>;
}

const SearchBox: FC<SearchBoxProps> = ({
  mapRef,
  value,
  setValue,
  isSideMenuExpanded,
  onToggleSideMenu,
  setShowRouteBox,
  isRouteBoxOpen,
  isSettingsOpen,
  isStylesCardOpen,
  isSimpleSearch = false,
  bottomSheetRef
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [
    isNLChecked
    // setIsNLChecked
  ] = useState(false);
  const autocompleteRef = useRef<HTMLInputElement | null>(null);
  const { mapUnit, currentLocationData, viewpoint } = useMap();
  const {
    clusters,
    suggestions,
    setSuggestions,
    selectedMarker,
    marker,
    search,
    isSearching,
    clearPoiList,
    setSelectedMarker,
    setHoveredMarker,
    setSearchingState,
    setIsSearching
  } = usePlace();
  const { t, i18n } = useTranslation();
  const langDir = i18n.dir();
  const currentLang = i18n.language;
  const isLanguageRTL = ["ar", "he"].includes(currentLang);
  const {
    bottomSheetCurrentHeight = 0,
    setBottomSheetMinHeight,
    setBottomSheetHeight,
    POICard,
    setUI,
    ui
  } = useBottomSheet();
  const { isDesktop, isDesktopBrowser, isTablet } = useDeviceMediaQuery();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isDesktop) {
      if (isFocused && !!value?.length) setUI(ResponsiveUIEnum.search);
      else if (ui === ResponsiveUIEnum.search && !value?.length) setUI(ResponsiveUIEnum.explore);
    }
  }, [setUI, isFocused, value, isDesktop, ui]);

  useEffect(() => {
    if (isRouteBoxOpen || isSettingsOpen || isStylesCardOpen) {
      setValue("");
      clearPoiList();
    }
  }, [value, setValue, clearPoiList, isRouteBoxOpen, isSettingsOpen, isStylesCardOpen]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (ui === ResponsiveUIEnum.explore) {
        setIsFocused(false);
        searchInputRef.current?.blur();
        setBottomSheetMinHeight(BottomSheetHeights.explore.min);
      }
    };

    if (!isDesktop) {
      document.addEventListener("touchmove", handleClickOutside);
      return () => {
        document.removeEventListener("touchmove", handleClickOutside);
      };
    }
  }, [ui, isDesktop, bottomSheetRef, setBottomSheetMinHeight]);

  useEffect(() => {
    if (selectedMarker) {
      const { longitude: lng, latitude: lat } = viewpoint;
      mapRef?.current?.setCenter({ lat, lng });
    }
  }, [mapRef, selectedMarker, viewpoint]);

  useEffect(() => {
    if (suggestions && suggestions.renderMarkers) {
      const options = isDesktop
        ? SEARCH_ROUTE_BOUND_OPTIONS.DESKTOP
        : isTablet
        ? SEARCH_ROUTE_BOUND_OPTIONS.TABLET
        : SEARCH_ROUTE_BOUND_OPTIONS.MOBILE;
      const positions = suggestions.list.map(s => s.position) as Position[];

      if (positions.length === 1) {
        const [lng, lat] = positions[0];
        mapRef.current?.setCenter({ lat, lng });
      } else {
        const bounds = getBoundsFromLineString(positions);
        bounds && mapRef.current?.fitBounds(bounds, options);
      }
    }
  }, [isDesktop, isTablet, mapRef, suggestions]);

  // TODO: NL Search disabled for the time being
  // useEffect(() => {
  //   if (currentMapProvider === MapProviderEnum.GRAB || currentMapProvider === MapProviderEnum.HERE) {
  //     setIsNLChecked(false);
  //   }
  // }, [isNLChecked, currentMapProvider]);

  // useEffect(() => {
  //   if (new URLSearchParams(location.search).get(NL_TOGGLE) === "true" && NL_BASE_URL && NL_API_KEY) {
  //     setIsNLChecked(true);
  //   }

  //   return () => {
  //     if (timeoutIdRef.current) {
  //       clearTimeout(timeoutIdRef.current);
  //     }
  //   };
  // }, []);

  const handleSearch = useCallback(
    async (value: string, exact = false, action: string, isQueryId = false) => {
      setSearchingState(!!value?.length);
      const { lng: longitude, lat: latitude } = mapRef.current?.getCenter() as LngLat;
      const vp = { longitude, latitude };

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      setIsSearching(true);
      timeoutIdRef.current = setTimeout(async () => {
        await search(
          value,
          { longitude: vp.longitude, latitude: vp.latitude },
          exact,
          undefined,
          TriggeredByEnum.PLACES_SEARCH,
          action,
          isNLChecked,
          isQueryId
        );
        setIsSearching(false);
      }, 200);
    },
    [mapRef, search, setSearchingState, setIsSearching, isNLChecked]
  );

  const onSelectSuggestion = useCallback(
    async ({ queryid, placeid, label }: OptionType) => {
      if (queryid) {
        setValue(label);
        await handleSearch(queryid, true, AnalyticsEventActionsEnum.SUGGESTION_SELECTED, true);
        setBottomSheetMinHeight(window.innerHeight * 0.4 - 10);
        setBottomSheetHeight(window.innerHeight * 0.4);
        setTimeout(() => {
          setBottomSheetMinHeight(BottomSheetHeights.explore.min);
          setBottomSheetHeight(window.innerHeight);
        }, 500);
      } else if (placeid) {
        const selectedMarker = suggestions?.list.find(s => s.placeId === placeid);
        selectedMarker && setSuggestions({ list: [selectedMarker], renderMarkers: true });
        await setSelectedMarker(selectedMarker);
      }
    },
    [
      handleSearch,
      setBottomSheetHeight,
      setBottomSheetMinHeight,
      setSelectedMarker,
      setSuggestions,
      setValue,
      suggestions
    ]
  );

  const setHover = useCallback(
    ({ placeid }: OptionType) => {
      if (!placeid) return;

      const selectedMarker = suggestions?.list.find(s => s.placeId === placeid);
      setHoveredMarker(selectedMarker);
    },
    [setHoveredMarker, suggestions]
  );

  const onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    clearPoiList();
    setValue(value);
    handleSearch(value, false, AnalyticsEventActionsEnum.AUTOCOMPLETE);
  };

  const onSearch = () => {
    if (value) {
      clearPoiList();
      handleSearch(value, false, AnalyticsEventActionsEnum.SEARCH_ICON_CLICK);
      autocompleteRef?.current?.focus();
    }
    autocompleteRef?.current?.focus();
  };

  const onNLPChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    clearPoiList();
    setValue(value);
  };

  const renderOption = (option: OptionType) => {
    const { id, queryid, position, label, country, region } = option;
    const separateIndex = label ? label.indexOf(",") : -1;
    const title = separateIndex > -1 ? label.substring(0, separateIndex) : label;
    const destCoords = position ? (JSON.parse(position) as number[]) : undefined;
    const geodesicDistance = destCoords
      ? calculateGeodesicDistance(
          currentLocationData?.currentLocation
            ? [
                currentLocationData.currentLocation.longitude as number,
                currentLocationData.currentLocation.latitude as number
              ]
            : [viewpoint.longitude, viewpoint.latitude],
          [destCoords[0], destCoords[1]],
          mapUnit === METRIC ? (KILOMETERS.toLowerCase() as Units) : (MILES.toLowerCase() as Units)
        )
      : undefined;
    const localizeGeodesicDistance = () => {
      const formatter = new Intl.NumberFormat(currentLang, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return formatter.format(geodesicDistance || 0);
    };

    const geodesicDistanceUnit = geodesicDistance
      ? mapUnit === METRIC
        ? t("geofence_box__km__short.text")
        : t("geofence_box__mi__short.text")
      : undefined;

    return (
      <Flex key={id} data-testid={`suggestion-${id}`} className="option-container" onMouseOver={() => setHover(option)}>
        <Flex className={`icon ${queryid ? "icon-search-gray" : "icon-pin-gray"}`} />
        <View className="option-details">
          <Text>{title}</Text>
          <Flex gap="0" alignItems="center">
            {geodesicDistanceUnit && (
              <>
                <Flex gap="0.3rem" direction={isLanguageRTL ? "row-reverse" : "row"}>
                  <Text variation="tertiary">{localizeGeodesicDistance()}</Text>
                  <Text variation="tertiary">{geodesicDistanceUnit}</Text>
                </Flex>
                <View className="separator" />
              </>
            )}
            {region && country && <Text variation="tertiary">{`${region}, ${country}`}</Text>}
          </Flex>
        </View>
      </Flex>
    );
  };

  const options = useMemo(
    () =>
      suggestions?.list.map(({ id, queryId, placeId, position, label, address, country, region }: SuggestionType) => {
        return {
          id,
          queryid: queryId ? queryId : "",
          placeid: placeId ? placeId : "",
          position: position ? JSON.stringify(position) : "",
          label: label ? label : "",
          address: address ? JSON.stringify(address) : "",
          country: country ? country : "",
          region: region ? region : ""
        };
      }),
    [suggestions]
  );

  const onClearSearch = () => {
    setValue("");
    clearPoiList();
    isSimpleSearch && setUI && setUI(ResponsiveUIEnum.explore);
  };

  const markers = useMemo(() => {
    if (suggestions && suggestions?.list.length >= 1 && suggestions.renderMarkers) {
      return suggestions.list.map(s =>
        s.placeId ? (
          <SuggestionMarker
            key={s.id}
            active={s.placeId === selectedMarker?.placeId}
            searchValue={value}
            setSearchValue={setValue}
            {...s}
          />
        ) : null
      );
    } else if (clusters) {
      return Object.keys(clusters).reduce((acc, key) => {
        const cluster = clusters[key];
        const containsSelectedPoi = cluster.find(o => o.id === selectedMarker?.id) ? true : false;
        const s = containsSelectedPoi ? cluster.find(o => o.id === selectedMarker?.id) || cluster[0] : cluster[0];

        acc.push(
          <SuggestionMarker
            key={s.id}
            active={s.id === selectedMarker?.id}
            searchValue={value}
            setSearchValue={setValue}
            {...s}
          />
        );
        return acc;
      }, [] as Array<JSX.Element>);
    }
  }, [suggestions, selectedMarker, clusters, value, setValue]);

  const mapMarker = useMemo(
    () => marker && <Marker searchValue={value} setSearchValue={setValue} {...marker} />,
    [marker, value, setValue]
  );

  const hideBorderRadius = useMemo(() => {
    return (
      ((!!document.getElementsByClassName("amplify-autocomplete__menu").length && !!value) ||
        !!suggestions?.list.length ||
        isSearching) &&
      isFocused
    );
  }, [value, suggestions?.list.length, isFocused, isSearching]);

  const simpleSearchOnFocus = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setIsFocused(true);
    if ((isAndroid || isIOS) && !isDesktopBrowser) {
      if (bottomSheetCurrentHeight < window.innerHeight * 0.9) {
        setBottomSheetHeight(window.innerHeight);
        setTimeout(() => {
          bottomSheetRef?.current?.snapTo(window.innerHeight);
        }, 0);
        setTimeout(() => {
          setBottomSheetMinHeight(BottomSheetHeights.explore.min);
        }, 200);
      }
    } else {
      if (bottomSheetCurrentHeight < window.innerHeight * 0.4) {
        setBottomSheetMinHeight(window.innerHeight * 0.4 - 10);
        setBottomSheetHeight(window.innerHeight * 0.4);

        setTimeout(() => {
          setBottomSheetMinHeight(BottomSheetHeights.explore.min);
          setBottomSheetHeight(window.innerHeight);
        }, 200);
      }
    }
  };

  const simpleSearchBlur = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setIsFocused(false);
      !value?.length && setUI(ResponsiveUIEnum.explore);

      setTimeout(() => {
        if (bottomSheetCurrentHeight < window.innerHeight * 0.9) {
          setBottomSheetHeight(5000);
          setBottomSheetMinHeight(window.innerHeight - 10);
        }
      }, 200);

      setTimeout(() => {
        setBottomSheetHeight(window.innerHeight);
      }, 500);
    },
    [bottomSheetCurrentHeight, setBottomSheetHeight, setBottomSheetMinHeight, setUI, value?.length]
  );

  const onFormSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleSearch(value, true, AnalyticsEventActionsEnum.ENTER_BUTTON);

      if (options?.length) {
        setTimeout(() => {
          setBottomSheetMinHeight(window.innerHeight * 0.4 - 10);
          setBottomSheetHeight(window.innerHeight * 0.4);
        }, 200);
        searchInputRef?.current?.blur();
      }
    },
    [handleSearch, options, setBottomSheetHeight, setBottomSheetMinHeight, value]
  );

  return (
    <>
      {ui !== ResponsiveUIEnum.poi_card && !POICard ? (
        <>
          {isSimpleSearch ? (
            <Flex direction="column" gap="0" className="simple-search-bar" ref={searchContainerRef}>
              <form onSubmit={onFormSubmit}>
                <Flex gap="0" padding="0 0.61rem 0.61rem">
                  <InputField
                    dataTestId="search-box-input"
                    searchInputRef={searchInputRef}
                    value={value}
                    onChange={!isNLChecked ? onChange : onNLPChange}
                    dir={langDir}
                    onKeyDown={e => e.stopPropagation()}
                    onFocus={simpleSearchOnFocus}
                    onBlur={simpleSearchBlur}
                    placeholder={t("search.text") as string}
                    innerStartComponent={
                      <Flex
                        className="icon inner-end-component"
                        onClick={onSearch}
                        alignItems="center"
                        margin="0 0.3rem 0 0.8rem"
                      >
                        <Flex className="icon-search" data-tooltip-content={t("search.text")} />
                      </Flex>
                    }
                    innerEndComponent={
                      <Flex className="inner-end-components">
                        {!!value && (
                          <Flex className="icon outter-end-component" onClick={onClearSearch}>
                            <IconClose />
                          </Flex>
                        )}
                      </Flex>
                    }
                  />
                  {!!value && (
                    <Button className="clear-button" onClick={onClearSearch}>
                      {t("confirmation_modal__cancel.text")}
                    </Button>
                  )}
                </Flex>
                {/* TODO: NL Search disabled for the time being */}
                {/* {!isSearching &&
                NL_BASE_URL &&
                NL_API_KEY &&
                currentMapProvider !== MapProviderEnum.GRAB &&
                currentMapProvider !== MapProviderEnum.HERE ? (
                  <Flex gap="0" padding="0 0.61rem 0.61rem" alignItems="center">
                    <SwitchField
                      label={t("nl_search_label.text") as string}
                      labelPosition="end"
                      size="small"
                      isChecked={isNLChecked}
                      onChange={e => setIsNLChecked(e.target.checked)}
                      style={{
                        marginLeft: "10px"
                      }}
                    />
                    <Badge size="small" variation="warning" style={{ backgroundColor: "#FF9900", color: "white" }}>
                      {t("prototype.text") as string}
                    </Badge>
                  </Flex>
                ) : (
                  <></>
                )} */}
                {/* {isNLChecked && !value ? (
                  <Flex
                    gap="0"
                    width="100%"
                    alignItems="start"
                    paddingLeft="10px"
                    style={{
                      flexDirection: "column"
                    }}
                  >
                    <h5>{t("try_asking.text") as string}:</h5>
                    <Flex
                      style={{
                        flexDirection: "column",
                        gap: "0.1px",
                        marginBottom: "12px",
                        fontStyle: "italic",
                        fontSize: "12px"
                      }}
                    >
                      <q>{t("nl_query_example_1.text") as string}</q>
                      <q>{t("nl_query_example_2.text") as string}</q>
                      <q>{t("nl_query_example_3.text") as string}</q>
                    </Flex>
                  </Flex>
                ) : (
                  <></>
                )} */}
              </form>
              <Flex gap="0" direction="column">
                {isSearching ? (
                  !isNLChecked ? (
                    <Flex className="search-loader-container">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Flex className="skeleton-container" key={index}>
                          <Placeholder />
                          <Placeholder width="65%" />
                        </Flex>
                      ))}
                    </Flex>
                  ) : (
                    <Flex
                      gap="0"
                      padding="0 0.61rem 0.61rem"
                      alignItems="center"
                      style={{
                        marginLeft: "10px"
                      }}
                    >
                      <NLSearchLoader nlLoadText={nlLoadText}></NLSearchLoader>
                    </Flex>
                  )
                ) : !isSearching && !!value && !suggestions?.list.length ? (
                  !isNLChecked ? (
                    <Flex className="not-found-container">
                      <NotFoundCard />
                    </Flex>
                  ) : (
                    <Flex
                      gap="0"
                      width="100%"
                      alignItems="start"
                      paddingLeft="10px"
                      style={{
                        flexDirection: "column"
                      }}
                    >
                      <Flex>
                        <h5>{t("try_asking.text") as string}:</h5>
                      </Flex>
                      <Flex
                        style={{
                          flexDirection: "column",
                          gap: "0.1px",
                          marginBottom: "12px",
                          fontStyle: "italic",
                          fontSize: "12px"
                        }}
                      >
                        <q>{t("nl_query_example_1.text") as string}</q>
                        <q>{t("nl_query_example_2.text") as string}</q>
                        <q>{t("nl_query_example_3.text") as string}</q>
                      </Flex>
                    </Flex>
                  )
                ) : (
                  <Flex
                    gap="0"
                    direction="column"
                    className={`search-complete ${!isDesktop ? "search-complete-mobile" : ""}`}
                    maxHeight={bottomSheetCurrentHeight}
                    paddingBottom={options?.length ? "5.1rem" : ""}
                  >
                    {!!options?.length &&
                      options.map(option => (
                        <div
                          data-testid="search-suggestions"
                          key={option.id}
                          onClick={() => {
                            onSelectSuggestion({ ...option });
                          }}
                          className="option-wrapper"
                        >
                          {renderOption(option)}
                        </div>
                      ))}
                  </Flex>
                )}
              </Flex>
            </Flex>
          ) : (
            <Flex
              data-testid="search-bar-container"
              className="search-bar"
              style={{
                flexDirection: "column",
                left: isSideMenuExpanded ? 252 : 20,
                borderBottomLeftRadius: hideBorderRadius ? "0px" : "8px",
                borderBottomRightRadius: hideBorderRadius ? "0px" : "8px"
              }}
            >
              <Flex gap="0" width="100%" height="100%" alignItems="center">
                <Autocomplete
                  data-testid="search-box-input"
                  className={!value && !suggestions?.list.length ? "search-complete noEmpty" : "search-complete"}
                  ref={autocompleteRef}
                  inputMode="search"
                  hasSearchIcon={false}
                  label={t("search.text")}
                  dir={langDir}
                  innerStartComponent={
                    <Flex data-testid="hamburger-menu" className="inner-start-component" onClick={onToggleSideMenu}>
                      <IconActionMenu />
                    </Flex>
                  }
                  size="large"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onSubmit={e => handleSearch(e, true, AnalyticsEventActionsEnum.ENTER_BUTTON)}
                  value={value}
                  onChange={!isNLChecked ? onChange : onNLPChange}
                  onClear={clearPoiList}
                  placeholder={t("search.text") as string}
                  options={options || []}
                  results={options?.length || 0}
                  renderOption={renderOption}
                  optionFilter={() => true}
                  onSelect={onSelectSuggestion}
                  menuSlots={{
                    LoadingIndicator: (
                      <Flex className="search-loader-container">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Flex className="skeleton-container" key={index}>
                            <Placeholder />
                            <Placeholder width="65%" />
                          </Flex>
                        ))}
                      </Flex>
                    ),
                    Empty: !isNLChecked ? (
                      !!value && !suggestions?.list.length ? (
                        <Flex className="not-found-container">
                          <NotFoundCard />
                        </Flex>
                      ) : null
                    ) : (
                      <Flex
                        gap="0"
                        className="inner-search-component"
                        style={{
                          flexDirection: "column",
                          gap: "0"
                        }}
                      >
                        <Flex>
                          <h3>{t("try_asking.text") as string}:</h3>
                        </Flex>
                        <Flex
                          style={{
                            flexDirection: "column",
                            gap: "0.1px",
                            marginBottom: "20px",
                            fontStyle: "italic",
                            fontSize: "15px"
                          }}
                        >
                          <q>{t("nl_query_example_1.text") as string}</q>
                          <q>{t("nl_query_example_2.text") as string}</q>
                          <q>{t("nl_query_example_3.text") as string}</q>
                        </Flex>
                        <Flex>
                          {t("nl_search_footer_label.text") as string}
                          <Badge
                            size="small"
                            variation="warning"
                            style={{ backgroundColor: "#FF9900", color: "white" }}
                          >
                            {t("prototype.text") as string}
                          </Badge>
                        </Flex>
                      </Flex>
                    )
                  }}
                  isLoading={isSearching}
                  innerEndComponent={
                    <Flex className="inner-end-components">
                      <>
                        <Flex className="icon inner-end-component" onClick={onSearch}>
                          <Flex
                            className="icon-search"
                            data-tooltip-id="search-button"
                            data-tooltip-place="bottom"
                            data-tooltip-content={t("search.text")}
                          />
                          <Tooltip id="search-button" />
                        </Flex>
                        <Flex
                          className="icon outter-end-component"
                          onClick={value ? onClearSearch : () => setShowRouteBox(true)}
                        >
                          {value ? (
                            <IconClose />
                          ) : (
                            <>
                              <IconDirections
                                data-tooltip-id="directions-button"
                                data-tooltip-place="bottom"
                                data-tooltip-content={t("routes.text")}
                              />
                              <Tooltip id="directions-button" />
                            </>
                          )}
                        </Flex>
                      </>
                    </Flex>
                  }
                />
                {/* TODO: NL Search disabled for the time being */}
                {/* {NL_BASE_URL &&
                NL_API_KEY &&
                currentMapProvider !== MapProviderEnum.GRAB &&
                currentMapProvider !== MapProviderEnum.HERE ? (
                  <Flex
                    className="nl-search-container"
                    id="nl-search"
                    data-testid="nl-search"
                    style={{
                      flexDirection: "column",
                      left: isSideMenuExpanded ? 0 : 0,
                      top: "44px",
                      borderBottomLeftRadius: hideBorderRadius ? "0px" : "8px",
                      borderBottomRightRadius: hideBorderRadius ? "0px" : "8px",
                      gap: "0.1px",
                      padding: "0.5em",
                      flex: 1
                    }}
                  >
                    {isSearching && isNLChecked ? (
                      <Flex
                        gap="0"
                        width="100%"
                        height="100%"
                        alignItems="center"
                        style={{
                          marginLeft: "10px"
                        }}
                      >
                        <NLSearchLoader nlLoadText={nlLoadText}></NLSearchLoader>
                      </Flex>
                    ) : (
                      <Flex
                        gap="0"
                        width="100%"
                        height="100%"
                        alignItems="center"
                        style={{
                          borderBottom: isNLChecked && !value ? "1px solid var(--grey-color-3)" : ""
                        }}
                      >
                        <SwitchField
                          label={t("nl_search_label.text") as string}
                          labelPosition="end"
                          size="small"
                          isChecked={isNLChecked}
                          onChange={e => setIsNLChecked(e.target.checked)}
                          style={{
                            marginLeft: "10px"
                          }}
                        />
                        <Badge size="small" variation="warning" style={{ backgroundColor: "#FF9900", color: "white" }}>
                          {t("prototype.text") as string}
                        </Badge>
                      </Flex>
                    )}
                    {isNLChecked && !value ? (
                      <Flex
                        gap="0"
                        width="100%"
                        height="100%"
                        alignItems="start"
                        className="inner-search-component"
                        marginLeft="10px"
                        marginBottom="0.2em"
                        style={{
                          flexDirection: "column",
                          gap: "0"
                        }}
                      >
                        <h5>{t("try_asking.text") as string}:</h5>
                        <Flex
                          style={{
                            flexDirection: "column",
                            gap: "0.1px",
                            marginBottom: "12px",
                            fontStyle: "italic",
                            fontSize: "12px"
                          }}
                        >
                          <q>{t("nl_query_example_1.text") as string}</q>
                          <q>{t("nl_query_example_2.text") as string}</q>
                          <q>{t("nl_query_example_3.text") as string}</q>
                        </Flex>
                      </Flex>
                    ) : (
                      <></>
                    )}
                  </Flex>
                ) : (
                  <></>
                )} */}
              </Flex>
            </Flex>
          )}
        </>
      ) : (
        POICard
      )}
      {markers}
      {mapMarker}
    </>
  );
};

export default SearchBox;
