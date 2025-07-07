/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { FC, lazy } from "react";

import { Button, Card, Flex, Text, View, Divider } from "@aws-amplify/ui-react";
import { IconClose, IconCompass, IconGear, IconInfo, IconRadar } from "@demo/assets/svgs";
import { appConfig } from "@demo/core/constants";
import { useAuth } from "@demo/core/AuthProvider";
import { useUnauthSimulation } from "@demo/hooks";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import "./styles.scss";

const Logo = lazy(() => import("@demo/atomicui/atoms/Logo").then(module => ({ default: module.Logo })));

const {
	ROUTES: { DEFAULT, DEMO }
} = appConfig;

export interface SidebarProps {
	onCloseSidebar: () => void;
	onShowSettings: () => void;
	onShowAboutModal: () => void;
	onShowUnauthSimulation: () => void;
	onOpenSignInModal: () => void;
}

const Sidebar: FC<SidebarProps> = ({
	onCloseSidebar,
	onShowSettings,
	onShowAboutModal,
	onShowUnauthSimulation,
	onOpenSignInModal
}) => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { user, isAuthenticated, signOut } = useAuth();
	const { setHideGeofenceTrackerShortcut } = useUnauthSimulation();

	const onClickSignInButton = () => {
		onCloseSidebar();
		onOpenSignInModal();
	};

	const onClickSignOutButton = async () => {
		try {
			await signOut();
			onCloseSidebar();
		} catch (error) {
			console.error('Sign out failed:', error);
		}
	};

	const onClickUnauthSimulation = () => {
		onCloseSidebar();
		onShowUnauthSimulation();
		setHideGeofenceTrackerShortcut(true);
	};

	const onClickSettings = () => {
		onCloseSidebar();
		onShowSettings();
	};

	const onClickMore = () => {
		onCloseSidebar();
		onShowAboutModal();
	};

	return (
		<Card data-testid="side-bar" className="side-bar">
			<Flex className="title-bar">
				<Logo
					width="100%"
					style={{
						padding: "16px 20px",
						cursor: "pointer"
					}}
					onClick={() => navigate(DEFAULT)}
				/>

				<View className="icon-container">
					<IconClose data-testid="icon-close" onClick={onCloseSidebar} />
				</View>
			</Flex>
			<View as="ul" className="side-bar__menu">
				<Flex
					className="link-item"
					onClick={() => {
						navigate(DEMO);
						onCloseSidebar();
					}}
				>
					<IconCompass className="menu-icon" />
					<Text>{t("navigate.text")}</Text>
				</Flex>
				<Flex className="link-item" onClick={() => onClickUnauthSimulation()}>
					<IconRadar className="menu-icon" />
					<Text>{t("trackers.text")}</Text>
				</Flex>
				<Flex className="link-item" onClick={onClickSettings}>
					<IconGear className="menu-icon" />
					<Text>{t("settings.text")}</Text>
				</Flex>
				<Flex className="link-item" onClick={onClickMore}>
					<IconInfo className="menu-icon" />
					<Text>{t("about.text")}</Text>
				</Flex>
			</View>
			{/* <List
				listArray={marketingMenuOptionsData}
				className="hideScroll verticle-list side-bar__external-menu"
				hideIcons
			/> */}
			{/* <View className="button-wrapper">
				<Button
					data-testid="provide-feedback-button"
					variation="primary"
					fontFamily="AmazonEmber-Bold"
					textAlign="center"
					marginTop="0.62rem"
					onClick={() => onClickFeedbackButton()}
				>
					{t("fm__provide_feedback_btn.text")}
				</Button>
			</View> */}
			{isAuthenticated && user ? (
				<>
					<Divider margin="1rem 0" />
					<Flex direction="column" className="user-info-section" padding="0 1.25rem">
						<Text className="user-info-label" fontSize="0.75rem" color="gray" marginBottom="0.25rem">
							Signed in as:
						</Text>
						<Text className="user-email" fontSize="0.875rem" fontWeight="bold" marginBottom="1rem">
							{user.signInDetails?.loginId || user.username}
						</Text>
						<Button
							data-testid="sign-out-button"
							variation="primary"
							fontFamily="AmazonEmber-Bold"
							textAlign="center"
							onClick={onClickSignOutButton}
						>
							Sign Out
						</Button>
					</Flex>
				</>
			) : (
				<View className="button-wrapper">
					<Button
						data-testid="sign-in-button"
						variation="primary"
						fontFamily="AmazonEmber-Bold"
						textAlign="center"
						marginTop="0.62rem"
						onClick={() => onClickSignInButton()}
					>
						{t("fm__sign_in_btn.text")}
					</Button>
				</View>
			)}
		</Card>
	);
};

export default Sidebar;
