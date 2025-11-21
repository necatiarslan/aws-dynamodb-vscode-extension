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
- **Table Management**:
  - **Create Table**: Create new DynamoDB tables through UI
  - **Delete Table**: Delete tables with confirmation
  - **Edit Capacity**: Modify table capacity settings
- **Item Operations**:
  - **Query Table**: Execute queries with partition and sort key filters
  - **Scan Table**: Perform full table scans with configurable limits
  - **Add Items**: Create new items with support for all DynamoDB data types
  - **Edit Items**: Update existing items, change data types, add/remove attributes
  - **Delete Items**: Remove items from your tables
- **Workspace Features**:
  - **Add/Remove Tables**: Add tables from any region to your workspace
  - **AWS Profile Support**: Work with multiple AWS profiles seamlessly
  - **Filter Tables**: Quickly find tables by name
  - **Favorites**: Mark frequently used tables as favorites
  - **Export Table Details**: View and export complete table configurations as JSON

## Add New Item
<img src="media/screenshot-add-new-item.png" alt="screenshoot" width="800">

## Edit Item
<img src="media/screenshot-edit-item.png" alt="screenshoot" width="800">

## Query Table
<img src="media/screenshot-query-table.png" alt="screenshoot" width="800">

## Scan Table
<img src="media/screenshot-scan-table.png" alt="screenshoot" width="800">

## 🔍 Item Management

### Query Table
Query your DynamoDB tables efficiently using partition and sort keys:

**Features:**
- **Partition Key Query**: Required field to query items by partition key
- **Sort Key Filter**: Optional filter for tables with composite keys
- **Limit Control**: Set maximum number of items to return (1-1000)
- **Results Grid**: View query results in an interactive table with:
  - Key attributes highlighted with 🔑 icon
  - NULL values displayed as "NULL" text
  - Edit and delete actions for each item
- **Quick Actions**:
  - **New Item**: Add a new item and automatically query it
  - **Copy JSON**: Export results to clipboard
  - **Edit Item**: Click ✏️ to modify any item
  - **Delete Item**: Remove items with confirmation

**Workflow:**
1. Right-click on a table → Select "Query Table"
2. Enter partition key value (required)
3. Enter sort key value (optional, if table has sort key)
4. Set result limit (default: 100)
5. Click "🔍 Query" to execute
6. View results in the grid below

### Scan Table
Perform full table scans to retrieve items:

**Features:**
- **Flexible Scanning**: Scan entire table or limit results
- **Limit Control**: Configure maximum items to scan (1-1000)
- **Warning System**: Visual warning about scan costs for large tables
- **Results Display**: Same interactive grid as Query with:
  - All attributes from scanned items
  - Scanned count vs. returned count
  - Edit and delete capabilities
- **Export Options**: Copy all results as JSON

**Important Notes:**
- ⚠️ Scans read every item in the table and can be expensive
- Consider using Query if you know the partition key
- Use limit parameter to control costs

**Workflow:**
1. Right-click on a table → Select "Scan Table"
2. Set scan limit (default: 100)
3. Click "🔍 Scan Table"
4. Review scanned count and results

### Add Item
Create new items with a user-friendly interface:

**Features:**
- **Primary Keys**: Required fields for partition and sort keys
- **Auto-populate**: Automatically suggests attributes from existing items
- **Data Type Support**:
  - **String (S)**: Text values
  - **Number (N)**: Numeric values with validation
  - **Boolean (BOOL)**: Yes/No radio buttons
  - **Null (NULL)**: Null values (no value input needed)
  - **Map (M)**: JSON objects
  - **List (L)**: JSON arrays
  - **String Set (SS)**: Sets of strings
  - **Number Set (NS)**: Sets of numbers
  - **Binary Set (BS)**: Sets of binary data
  - **Binary (B)**: Binary data
- **Dynamic Attributes**:
  - Add unlimited additional attributes
  - Change data types on the fly
  - Remove attributes with 🗑️ button
- **Validation**:
  - Required field checking
  - Numeric type validation
  - Boolean selection enforcement

**Workflow:**
1. Right-click on a table → Select "Add Item"
2. Fill in partition key value (required)
3. Fill in sort key value if applicable (required)
4. Click "➕ Add Attribute" to add more fields
5. Select data type from dropdown
6. Enter value (or select for boolean/null types)
7. Click "Add Item" to save

### Edit Item
Modify existing items with full control:

**Features:**
- **Read-only Keys**: Partition and sort keys are displayed but cannot be modified
- **Attribute Management**:
  - Update attribute values
  - Change attribute data types
  - Add new attributes
  - Remove existing attributes (except keys)
- **Same UI as Add Item**: Consistent experience with:
  - Type-specific inputs (radio buttons for booleans, etc.)
  - Data type dropdown for each attribute
  - Delete button (🗑️) for removable attributes
- **Delete Item**: Remove the entire item with confirmation
- **Auto-refresh**: Parent panel (Query/Scan) refreshes after save

**Workflow:**
1. From Query or Scan results, click ✏️ on any item
2. Modify attribute values as needed
3. Change data types using the dropdown
4. Add new attributes with "➕ Add Attribute"
5. Remove attributes with 🗑️ button
6. Click "💾 Update Item" to save changes
7. Or click "🗑️ Delete Item" to remove the item

**Smart Features:**
- Automatically detects removed attributes and sends REMOVE clause
- Validates data types before saving
- Shows clear error messages for validation failures
- Returns to parent panel after successful update


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
Search for "Aws DynamoDB" in the VSCode Extensions marketplace and click Install.

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
- Add Map, List, Set data types
- Add Binary data type
- Add Binary Set data type
- Add Global Secondary Indexes
- Add Local Secondary Indexes
- Add Table backup and restore
- Add DynamoDB Streams integration

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