export const getEnvironmentConfig = () => {
  const branch = process.env.AWS_BRANCH || 'sandbox';
  const env = process.env.ENV || 'dev';
  
  // Clean branch name for AWS resource naming
  const cleanBranch = branch
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .substring(0, 63); // AWS resource name length limit
  
  return {
    branch: cleanBranch,
    env,
    resourceSuffix: `${env}_${cleanBranch}`,
    email: {
      admin: process.env.ADMIN_EMAIL || 'inboxkundu@gmail.com',
      sender: process.env.SENDER_EMAIL || 'inboxkundu@gmail.com'
    }
  };
}; 