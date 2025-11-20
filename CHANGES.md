# AWS DynamoDB VSCode Extension - Changes & Fixes

## Overview
This document describes the changes made to convert the Lambda extension template into a fully functional DynamoDB table management extension.

## Major Changes

### 1. Fixed API Layer (`src/common/API.ts`)
- **Replaced Lambda SDK imports** with DynamoDB SDK imports (`@aws-sdk/client-dynamodb`)
- **Fixed client initialization**: Changed `DynamodbClient` to `DynamoDBClient` (correct casing)
- **Implemented `GetDynamodbList()`**: Lists DynamoDB tables using `ListTablesCommand` instead of Lambda functions
- **Implemented `GetDynamodb()`**: Uses `DescribeTableCommand` to get table details
- **Added `CreateDynamodbTable()`**: Creates new DynamoDB tables with partition key and optional sort key
- **Added `DeleteDynamodbTable()`**: Deletes DynamoDB tables
- **Added `ExtractTableDetails()`**: Helper function to parse table metadata including:
  - Partition Key (name and type)
  - Sort Key (name and type)
  - Billing Mode (On-Demand or Provisioned)
  - Read/Write Capacity
  - Table Size
  - Item Count
  - Table Class
  - Table Status
  - Global Secondary Indexes (GSI)
  - Local Secondary Indexes (LSI)
- **Removed/Stubbed Lambda-specific functions**:
  - `TriggerDynamodb()` - Not applicable for DynamoDB tables
  - `UpdateDynamodbCode()` - Not applicable for DynamoDB tables
  - `GetDynamodbConfiguration()` - Use DescribeTable instead

### 2. Updated Tree Structure (`src/dynamodb/DynamodbTreeItem.ts`)
- **Added new TreeItemTypes** for DynamoDB-specific nodes:
  - `PrimaryKey` - Container for key information
  - `PartitionKey` - Shows partition key details
  - `SortKey` - Shows sort key details
  - `Capacity` - Shows read/write capacity mode
  - `TableInfo` - Shows size, item count, class, and status
  - `Indexes` - Container for indexes
  - `Index` - Individual index details
- **Added icons** for new tree item types using VSCode theme icons

### 3. Updated Data Provider (`src/dynamodb/DynamodbTreeDataProvider.ts`)
- **Replaced Lambda-specific tree structure** with DynamoDB structure:
  - Removed: Code, Trigger, Logs nodes
  - Added: Primary Keys, Capacity, Table Info, Indexes nodes
- **Implemented `PopulateTableDetails()`**: Async method that:
  - Fetches table details when a table node is expanded
  - Populates partition and sort key information
  - Displays capacity mode and throughput
  - Shows table size, item count, class, and status
  - Lists all Global and Local Secondary Indexes
- **Added API import** to access table detail functions

### 4. Updated Tree View (`src/dynamodb/DynamodbTreeView.ts`)
- **Added expansion event listener**: Automatically loads table details when a table node is expanded
- This ensures fresh data is displayed each time a user expands a table

### 5. Updated Package Configuration (`package.json`)
- **Updated display name**: "AWS DynamoDB Manager"
- **Updated description**: "Manage & Monitor your AWS DynamoDB Tables - View table details, keys, capacity, indexes, and more"
- **Updated welcome message**: Changed from Lambda functions to DynamoDB tables
- **Updated command titles**: "View Table Details" instead of "Print Dynamodb"

## Features

### Current Features
✅ **List DynamoDB Tables**: Browse all tables in a region
✅ **View Table Details**: See complete table metadata
✅ **Primary Keys**: View partition and sort key names and types
✅ **Capacity Information**: See billing mode (On-Demand/Provisioned) and throughput
✅ **Table Statistics**: View table size, item count, table class, and status
✅ **Indexes**: Browse all GSI and LSI with their key schemas
✅ **Add/Remove Tables**: Add tables to the tree view and remove them
✅ **AWS Profile Selection**: Switch between different AWS profiles
✅ **Region Support**: Work with tables in different AWS regions
✅ **Filtering**: Filter tables by name
✅ **Favorites**: Mark tables as favorites

### Table Information Displayed

When you expand a DynamoDB table node, you'll see:

1. **Primary Keys**
   - Partition Key: name and data type (S, N, or B)
   - Sort Key: name and data type (if configured)

2. **Capacity**
   - Billing mode (PAY_PER_REQUEST or PROVISIONED)
   - Read capacity units (if provisioned)
   - Write capacity units (if provisioned)

3. **Table Info**
   - Table size in MB
   - Total item count
   - Table class (STANDARD or INFREQUENT_ACCESS)
   - Current status (ACTIVE, CREATING, DELETING, etc.)

4. **Indexes**
   - Global Secondary Indexes (GSI) with key schema
   - Local Secondary Indexes (LSI) with key schema
   - Shows "None" if no indexes exist

## How to Use

### 1. Add a Table
- Click the "+" icon in the DynamoDB TreeView
- Enter the AWS region (e.g., us-east-1)
- Enter table name or leave empty to list all tables
- Select tables from the list

### 2. View Table Details
- Expand a table node to see all metadata
- Details are fetched from AWS each time you expand
- Click "View Table Details" to see the raw JSON response

### 3. Remove a Table
- Right-click on a table
- Select "Remove Dynamodb"
- This only removes it from the view, not from AWS

## Future Enhancements (Not Implemented Yet)
- Create new tables through UI
- Delete tables
- Edit table capacity settings
- Query and scan table data
- Add/remove items
- Create/delete indexes

## Testing
To test the extension:
1. Ensure AWS credentials are configured (`~/.aws/credentials`)
2. Run `npm run compile` to compile TypeScript
3. Press F5 in VSCode to open Extension Development Host
4. Open the AWS DynamoDB view in the activity bar
5. Add your DynamoDB tables and expand to see details

## Error Resolution
All compilation errors have been fixed:
- ✅ Fixed DynamoDBClient import and casing
- ✅ Replaced Lambda commands with DynamoDB commands
- ✅ Fixed type annotations for TypeScript
- ✅ Removed non-existent Lambda SDK methods
- ✅ Added proper type definitions for table details

## Notes
- The extension maintains backward compatibility with existing state/settings from the Lambda extension
- Some Lambda-specific commands are kept as stubs to prevent breaking changes
- CloudWatch logs integration is not applicable for DynamoDB tables
- The extension uses on-demand billing mode by default when creating tables
