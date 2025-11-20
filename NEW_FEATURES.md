# DynamoDB VSCode Extension - New Features Implementation

## Overview
This document describes all the newly implemented features for the AWS DynamoDB VSCode extension.

## ✨ Implemented Features

### 1. Create Table Through UI ✅
**Command:** `DynamodbTreeView.CreateTable`  
**Location:** Tree View Title Bar (+Create Table icon)

**Workflow:**
1. Click the "Create Table" button in the tree view toolbar
2. Enter AWS Region (e.g., us-east-1)
3. Enter Table Name (alphanumeric, dots, hyphens, underscores)
4. Enter Partition Key Name (e.g., "id")
5. Select Partition Key Type (S/N/B)
6. Choose if you need a Sort Key (Yes/No)
7. If Yes, enter Sort Key Name and Type
8. Confirm table creation
9. Table is automatically created and added to your tree view

**Features:**
- Input validation for table names
- Support for both simple (partition key only) and composite (partition + sort key) keys
- Automatic billing mode set to PAY_PER_REQUEST (On-Demand) by default
- Table is automatically visible in tree view after creation

---

### 2. Delete Table Through UI ✅
**Command:** `DynamodbTreeView.DeleteTable`  
**Location:** Right-click on table → Delete Table

**Workflow:**
1. Right-click on any table in the tree view
2. Select "Delete Table"
3. Confirm deletion with warning dialog
4. Type exact table name to double-confirm
5. Table is permanently deleted from AWS

**Safety Features:**
- Modal warning dialog
- Double confirmation by typing table name
- Clear warning that action cannot be undone
- Table removed from tree view after successful deletion

---

### 3. Edit Table Capacity ✅
**Command:** `DynamodbTreeView.EditCapacity`  
**Location:** Right-click on table → Edit Table Capacity

**Workflow:**
1. Right-click on any table
2. Select "Edit Table Capacity"
3. Choose Billing Mode:
   - PAY_PER_REQUEST (On-Demand)
   - PROVISIONED
4. If Provisioned, enter:
   - Read Capacity Units (minimum 1)
   - Write Capacity Units (minimum 1)
5. Capacity is updated

**Features:**
- Shows current capacity settings
- Input validation for capacity values
- Supports switching between On-Demand and Provisioned billing
- Tree view auto-refreshes to show new capacity

---

### 4. Query Table ✅
**Command:** `DynamodbTreeView.QueryTable`  
**Location:** Right-click on table → Query Table

**Workflow:**
1. Right-click on any table
2. Select "Query Table"
3. Extension auto-detects table keys
4. Enter partition key value
5. Optionally filter by sort key
6. Results displayed in new JSON document
7. Shows count of returned items

**Features:**
- Automatic key schema detection
- Support for partition key and sort key queries
- Limit of 100 items (configurable in code)
- Results shown as formatted JSON
- Shows item count in success message

---

### 5. Scan Table ✅
**Command:** `DynamodbTreeView.ScanTable`  
**Location:** Right-click on table → Scan Table

**Workflow:**
1. Right-click on any table
2. Select "Scan Table"
3. Enter maximum number of items to scan (default: 100)
4. Confirm scan operation (warning about cost)
5. Results displayed in new JSON document

**Features:**
- Configurable scan limit
- Cost warning before execution
- Results shown as formatted JSON
- Shows actual count of scanned items
- Limited to specified maximum for safety

---

### 6. Add Item ✅
**Command:** `DynamodbTreeView.AddItem`  
**Location:** Right-click on table → Add Item

**Workflow:**
1. Right-click on any table
2. Select "Add Item"
3. Extension detects required keys
4. Enter partition key value
5. If table has sort key, enter sort key value
6. Optionally add additional attributes as JSON
7. Item is created

**Features:**
- Automatic key schema detection
- Guided input for required keys
- Support for additional attributes via JSON
- Validation of JSON format
- Success confirmation
- Tree view refreshes

**JSON Format for Additional Attributes:**
```json
{
  "name": {"S": "John Doe"},
  "age": {"N": "30"},
  "email": {"S": "john@example.com"}
}
```

---

### 7. Edit Item ✅
**Command:** `DynamodbTreeView.EditItem`  
**Location:** Right-click on table → Edit Item

**Workflow:**
1. Right-click on any table
2. Select "Edit Item"
3. Enter partition key value to identify item
4. If applicable, enter sort key value
5. Enter update expression (e.g., `SET #name = :nameVal`)
6. Enter expression attribute values as JSON
7. Updated item shown in new document

**Features:**
- Key-based item identification
- Support for DynamoDB update expressions
- Expression attribute values via JSON
- Shows updated attributes in result
- Comprehensive error handling

**Example Update:**
- Update Expression: `SET #name = :nameVal, #age = :ageVal`
- Values: `{":nameVal": {"S": "Jane"}, ":ageVal": {"N": "31"}}`

---

### 8. Delete Item ✅
**Command:** `DynamodbTreeView.DeleteItem`  
**Location:** Right-click on table → Delete Item

**Workflow:**
1. Right-click on any table
2. Select "Delete Item"
3. Enter partition key value
4. If applicable, enter sort key value
5. Confirm deletion with modal dialog
6. Item is permanently deleted

**Features:**
- Key-based item identification
- Confirmation dialog before deletion
- Success/error feedback
- Tree view refreshes
- Permanent deletion warning

---

## API Functions Added

### Table Operations
- `CreateDynamodbTable(region, tableName, pkName, pkType, skName?, skType?)`
- `DeleteDynamodbTable(region, tableName)`
- `UpdateTableCapacity(region, tableName, readCap?, writeCap?, billingMode?)`

### Query & Scan Operations
- `QueryTable(region, tableName, keyCondition, expressionValues, indexName?, limit?)`
- `ScanTable(region, tableName, limit?, filterExpression?, expressionValues?)`

### Item Operations
- `GetItem(region, tableName, key)`
- `PutItem(region, tableName, item)`
- `UpdateItem(region, tableName, key, updateExpression, expressionValues)`
- `DeleteItem(region, tableName, key)`

---

## Data Type Reference

DynamoDB supports three attribute types:
- **S** - String
- **N** - Number  
- **B** - Binary

When entering values in JSON format, always specify the type:
```json
{
  "attributeName": {"S": "string value"},
  "numberAttr": {"N": "123"},
  "binaryAttr": {"B": "base64encodedvalue"}
}
```

---

## Menu Structure

**Table Context Menu:**
- Fav / UnFav
- Hide / UnHide
- **Delete Table** (NEW)
- **Edit Capacity** (NEW)
- Goto AWS Console
- Remove from Workspace
- **Query Table** (NEW)
- **Scan Table** (NEW)
- **Add Item** (NEW)
- View Table Details
- Latest Logs

**Toolbar:**
- Show Only Favorite
- Show Hidden Nodes
- Filter
- Add Table
- **Create Table** (NEW)
- Select AWS Profile
- Refresh

---

## Usage Examples

### Example 1: Create a User Table
```
Region: us-east-1
Table Name: users
Partition Key: userId (S)
Sort Key: No
```

### Example 2: Create Orders Table with Composite Key
```
Region: us-east-1
Table Name: orders
Partition Key: customerId (S)
Sort Key: Yes → orderId (S)
```

### Example 3: Query Users Table
```
Operation: Query Table
Partition Key (userId): user123
Results: All items with userId = "user123"
```

### Example 4: Add User Item
```
Operation: Add Item
Partition Key (userId): user456
Additional Attributes:
{
  "name": {"S": "Alice Johnson"},
  "email": {"S": "alice@example.com"},
  "age": {"N": "28"},
  "active": {"BOOL": true}
}
```

### Example 5: Update User Item
```
Operation: Edit Item
Partition Key (userId): user456
Update Expression: SET email = :emailVal, age = :ageVal
Values: {":emailVal": {"S": "alice.new@example.com"}, ":ageVal": {"N": "29"}}
```

---

## Best Practices

1. **Always backup before deletion** - Table and item deletions are permanent
2. **Use Query instead of Scan** - Scans are expensive and slower
3. **Limit scan results** - Start with small limits (100) and increase if needed
4. **Use On-Demand for variable workloads** - Switch to Provisioned only when predictable
5. **Validate JSON carefully** - Invalid JSON will cause operations to fail
6. **Use meaningful key names** - Makes querying and filtering easier

---

## Keyboard Shortcuts

Currently, no keyboard shortcuts are implemented. All operations are accessible via:
- Tree view context menu (right-click)
- Tree view toolbar buttons
- Command palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)

---

## Troubleshooting

### "Table schema not found"
- The extension couldn't detect the table's key structure
- Try refreshing the table in the tree view
- Check if table exists in AWS console

### "Invalid JSON format"
- Ensure JSON is properly formatted
- Remember to include data type indicators (S, N, B)
- Use a JSON validator if unsure

### "Scan cost warning"
- Scans read every item in the table
- Consider using Query if you have a key to filter by
- Reduce the limit to minimize reads

### Table not appearing after creation
- Check AWS console to confirm table was created
- Table may still be in "CREATING" status
- Refresh the tree view
- Check AWS credentials and permissions

---

## Permissions Required

Your AWS IAM user/role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:ListTables",
        "dynamodb:DescribeTable",
        "dynamodb:CreateTable",
        "dynamodb:DeleteTable",
        "dynamodb:UpdateTable",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Notes

- All operations use the AWS SDK for JavaScript v3
- Operations are performed against real AWS DynamoDB tables
- There is no "undo" for delete operations  
- Billing applies for all AWS operations performed
- Index management (create/delete indexes) is NOT yet implemented
- Batch operations (batch write, batch get) are NOT yet implemented
- Streams and TTL management are NOT yet implemented

---

## Future Enhancements (Not Implemented)

- Create/Delete Global Secondary Indexes
- Create/Delete Local Secondary Indexes
- Batch write items
- Batch get items
- Enable/Disable streams
- Configure TTL settings
- Backup and restore operations
- Export table to S3
- Import from S3
- Point-in-time recovery
- Table tags management
- Advanced scan filters
- Pagination for large result sets
- Export query/scan results to CSV
- Item viewer/editor in tree view
