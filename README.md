# AWS DynamoDB Extension for VSCode
![screenshoot](media/ext-main.png)

🚀 **AWS DynamoDB Extension for VSCode** allows you to interact with your AWS DynamoDB tables directly within VSCode. This extension streamlines the management and monitoring of DynamoDB tables, providing an intuitive interface for viewing table details, keys, capacity, indexes, and more—all within your favorite code editor.

## ✨ Features

- **Browse DynamoDB Tables**: View all your DynamoDB tables in a tree structure
- **View Table Details**: See comprehensive table metadata including:
  - **Primary Keys**: Partition key and sort key (if configured) with data types
  - **Capacity Mode**: View billing mode (On-Demand or Provisioned) and throughput
  - **Table Statistics**: Size, item count, table class, and status
  - **Indexes**: Browse all Global and Local Secondary Indexes with their key schemas
- **Create Table**: Create new DynamoDB tables through UI
- **Delete Table**: Delete tables
- **Edit Capacity**: Edit table capacity settings
- **View and Edit Items**:View and edit table items
- **Query and Scan Table**: Query and scan operations
- **Add/Remove Tables**: Add tables from any region to your workspace
- **AWS Profile Support**: Work with multiple AWS profiles seamlessly
- **Filter Tables**: Quickly find tables by name
- **Favorites**: Mark frequently used tables as favorites
- **Export Table Details**: View and export complete table configurations as JSON

## 📋 Table Information Displayed

When you expand a DynamoDB table in the tree view, you'll see:

### Primary Keys
- Partition Key: name and data type (S=String, N=Number, B=Binary)
- Sort Key: name and data type (if table has a composite key)

### Capacity
- Billing mode (PAY_PER_REQUEST or PROVISIONED)
- Read capacity units (if provisioned mode)
- Write capacity units (if provisioned mode)

### Table Info
- Table size in megabytes
- Total item count
- Table class (STANDARD or INFREQUENT_ACCESS)
- Current status (ACTIVE, CREATING, UPDATING, DELETING)

### Indexes
- Global Secondary Indexes (GSI) with key schema
- Local Secondary Indexes (LSI) with key schema
- Displays "None" if no indexes exist

## 🚀 Getting Started

### 1. Install the Extension
Search for "AWS DynamoDB Manager" in the VSCode Extensions marketplace and click Install.

### 2. Configure AWS Credentials
Follow the AWS credentials setup guide below.

### 3. Add Tables
- Click the **+** icon in the DynamoDB TreeView
- Enter your AWS region (e.g., `us-east-1`)
- Enter a table name or leave empty to list all tables
- Select one or more tables from the list

### 4. View Table Details
- Expand any table node to see all metadata
- Table details are fetched fresh from AWS each time you expand
- Right-click and select "View Table Details" to see the raw JSON

## 💡 Usage Tips

- **Quick Access**: Mark frequently used tables as favorites for quick access
- **Multiple Regions**: Add tables from different regions to the same workspace
- **Filtering**: Use the filter function to quickly find tables by name
- **Refresh**: Click the refresh button to reload the table list
- **AWS Profiles**: Switch between different AWS profiles using the account icon

## Sponsor Me
If you find this extension useful, you can [sponsor me on GitHub](https://github.com/sponsors/necatiarslan).

## AWS Endpoint URL
You can change your AWS endpoint URL in the extension settings. To connect to LocalStack for local development, use: `http://localhost:4566`

To update the endpoint:
1. Click on the settings icon in the DynamoDB TreeView
2. Select "Update AWS Endpoint"
3. Enter your custom endpoint URL or leave empty for default AWS endpoints

## 🔐 AWS Credentials Setup
To access AWS, you need to configure AWS credentials.

For detailed information:
- [AWS CLI Configuration Guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [AWS Credentials YouTube Tutorial](https://www.youtube.com/watch?v=SON8sY1iOBU)

The extension supports all AWS credential types and searches in this order:

1. **Environment Variables:**
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_SESSION_TOKEN` (optional, for temporary credentials)

2. **Shared Credentials File:**
   - `~/.aws/credentials` (default profile or a named profile)
   - `~/.aws/config` (for region settings)

3. **EC2 Instance Metadata Service (IMDS):**
   - When running on EC2 with an attached IAM role

4. **ECS Container Credentials:**
   - When running in an ECS task

5. **SSO Credentials:**
   - If configured using AWS CLI SSO

6. **Web Identity Token:**
   - For federated identity access (e.g., IAM roles for Kubernetes/EKS)

## 🐛 Bug Report & Feature Requests
To report bugs or request new features:
[Create an Issue](https://github.com/necatiarslan/aws-dynamodb-vscode-extension/issues/new)

## 📝 Roadmap

### Coming Soon
- Add/remove indexes
- Table backup and restore
- DynamoDB Streams integration

## 🔗 Related Extensions
- [AWS Access VSCode Extension](https://bit.ly/aws-access-vscode-extension)
- [AWS Lambda VSCode Extension](https://bit.ly/vscode-aws-lambda)
- [AWS CloudWatch VSCode Extension](https://bit.ly/aws-cloudwatch-vscode-extension)
- [Apache Airflow VSCode Extension](https://bit.ly/airflow-vscode-extension)

## 👨‍💻 Author

**Necati ARSLAN**

- Email: necatia@gmail.com
- LinkedIn: [linkedin.com/in/necati-arslan](https://www.linkedin.com/in/necati-arslan/)

Follow me on LinkedIn for the latest news and updates!

---

## 📄 License
This project is licensed under the Apache License 2.0 - see the LICENSE file for details.

## 🙏 Acknowledgments
Special thanks to all contributors and users who provide feedback to make this extension better!