/* Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. */
/* SPDX-License-Identifier: MIT-0 */

import { Button, Flex, Text } from "@aws-amplify/ui-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { appConfig } from "@demo/core/constants";

const { ROUTES: { DEMO } } = appConfig;

const ErrorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromPath = searchParams.get('from') || DEMO;

  const handleGoBack = () => {
    navigate(fromPath);
  };

  const handleGoHome = () => {
    navigate(DEMO);
  };

  return (
    <Flex 
      direction="column" 
      alignItems="center" 
      justifyContent="center" 
      padding="2rem"
      gap="1.5rem"
      style={{ minHeight: "100vh", textAlign: "center" }}
    >
      <Text fontSize="3rem" fontWeight="bold" color="red">
        ⚠️
      </Text>
      <Text fontSize="1.5rem" fontWeight="bold">
        Something went wrong
      </Text>
      <Text fontSize="1rem" color="gray">
        An error occurred while loading the page. Please try again.
      </Text>
      <Flex gap="1rem">
        <Button 
          variation="primary" 
          onClick={handleGoBack}
        >
          Go Back
        </Button>
        <Button 
          variation="link" 
          onClick={handleGoHome}
        >
          Go to Demo
        </Button>
      </Flex>
    </Flex>
  );
};

export default ErrorPage; 