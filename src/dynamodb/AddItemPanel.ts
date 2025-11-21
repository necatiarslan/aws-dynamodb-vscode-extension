/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as api from '../common/API';
import * as ui from '../common/UI';

export class AddItemPanel {
	public static currentPanel: AddItemPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];
	private readonly _region: string;
	private readonly _tableName: string;
	private readonly _tableDetails: api.TableDetails;

	public static async createOrShow(
		extensionUri: vscode.Uri,
		region: string,
		tableName: string,
		tableDetails: api.TableDetails
	) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it
		if (AddItemPanel.currentPanel) {
			AddItemPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel
		const panel = vscode.window.createWebviewPanel(
			'addDynamodbItem',
			`Add Item to ${tableName}`,
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		AddItemPanel.currentPanel = new AddItemPanel(panel, extensionUri, region, tableName, tableDetails);
	}

	private constructor(
		panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
		region: string,
		tableName: string,
		tableDetails: api.TableDetails
	) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._region = region;
		this._tableName = tableName;
		this._tableDetails = tableDetails;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.command) {
					case 'addItem':
						await this._handleAddItem(message.item);
						return;
					case 'cancel':
						this._panel.dispose();
						return;
				}
			},
			null,
			this._disposables
		);
	}

	private async _handleAddItem(item: any) {
		try {
			ui.logToOutput('AddItemPanel: Adding item to DynamoDB');
			ui.logToOutput('Item data: ' + JSON.stringify(item, null, 2));
			
			// Convert the item to DynamoDB format
			const dynamodbItem = this._convertToDynamoDBFormat(item);
			ui.logToOutput('DynamoDB format: ' + JSON.stringify(dynamodbItem, null, 2));
			
			// Add the item
			const result = await api.PutItem(this._region, this._tableName, dynamodbItem);
			
			if (result.isSuccessful) {
				ui.showInfoMessage('Item added successfully!');
				// Close the panel on success
				this._panel.dispose();
			} else {
				// Send error back to webview
				this._panel.webview.postMessage({
					command: 'error',
					message: result.error?.message || 'Failed to add item'
				});
			}
		} catch (error: any) {
			ui.logToOutput('AddItemPanel: Error adding item', error);
			this._panel.webview.postMessage({
				command: 'error',
				message: error.message || 'An unexpected error occurred'
			});
		}
	}

	private _convertToDynamoDBFormat(item: any): any {
		const dynamodbItem: any = {};
		
		for (const [key, value] of Object.entries(item)) {
			const attr = value as any;
			dynamodbItem[key] = { [attr.type]: attr.value };
		}
		
		return dynamodbItem;
	}

	public dispose() {
		AddItemPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const nonce = getNonce();

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
	<title>Add Item to ${this._tableName}</title>
	<style>
		body {
			padding: 20px;
			font-family: var(--vscode-font-family);
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
		}
		.container {
			max-width: 800px;
			margin: 0 auto;
		}
		.header {
			margin-bottom: 24px;
		}
		h1 {
			font-size: 24px;
			font-weight: 600;
			margin: 0 0 8px 0;
		}
		.subtitle {
			color: var(--vscode-descriptionForeground);
			font-size: 13px;
		}
		.section {
			margin-bottom: 24px;
			padding: 16px;
			background-color: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
		}
		.section-title {
			font-size: 14px;
			font-weight: 600;
			margin-bottom: 12px;
			color: var(--vscode-foreground);
		}
		.field-group {
			margin-bottom: 16px;
		}
		.field-label {
			display: block;
			margin-bottom: 6px;
			font-size: 13px;
			font-weight: 500;
		}
		.required {
			color: var(--vscode-errorForeground);
		}
		.key-badge {
			display: inline-block;
			padding: 2px 8px;
			margin-left: 8px;
			font-size: 11px;
			background-color: var(--vscode-badge-background);
			color: var(--vscode-badge-foreground);
			border-radius: 3px;
		}
		input[type="text"], select {
			width: 100%;
			padding: 6px 8px;
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 2px;
			font-size: 13px;
			font-family: var(--vscode-font-family);
			box-sizing: border-box;
		}
		input[type="text"]:focus, select:focus {
			outline: 1px solid var(--vscode-focusBorder);
			border-color: var(--vscode-focusBorder);
		}
		.attribute-row {
			display: grid;
			grid-template-columns: 1fr 140px 1fr 40px;
			gap: 8px;
			margin-bottom: 8px;
			align-items: end;
		}
		.button-group {
			display: flex;
			gap: 8px;
			margin-top: 24px;
			justify-content: flex-end;
		}
		button {
			padding: 6px 14px;
			font-size: 13px;
			font-family: var(--vscode-font-family);
			border: none;
			border-radius: 2px;
			cursor: pointer;
		}
		.btn-primary {
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
		}
		.btn-primary:hover {
			background-color: var(--vscode-button-hoverBackground);
		}
		.btn-secondary {
			background-color: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
		}
		.btn-secondary:hover {
			background-color: var(--vscode-button-secondaryHoverBackground);
		}
		.btn-icon {
			background-color: transparent;
			color: var(--vscode-foreground);
			padding: 4px 8px;
			font-size: 16px;
		}
		.btn-icon:hover {
			background-color: var(--vscode-toolbar-hoverBackground);
		}
		.error-message {
			display: none;
			padding: 12px;
			margin-bottom: 16px;
			background-color: var(--vscode-inputValidation-errorBackground);
			border: 1px solid var(--vscode-inputValidation-errorBorder);
			color: var(--vscode-errorForeground);
			border-radius: 4px;
		}
		.error-message.show {
			display: block;
		}
		.add-attribute-btn {
			margin-top: 8px;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Add Item to Table</h1>
			<div class="subtitle">Table: ${this._tableName} | Region: ${this._region}</div>
		</div>

		<div class="error-message" id="errorMessage"></div>

		<form id="addItemForm">
			<!-- Primary Keys Section -->
			<div class="section">
				<div class="section-title">Primary Keys</div>
				
				<!-- Partition Key -->
				<div class="field-group">
					<label class="field-label">
						${this._tableDetails.partitionKey?.name || 'Partition Key'}
						<span class="required">*</span>
						<span class="key-badge">🔑 Partition Key</span>
						<span class="key-badge">${this._tableDetails.partitionKey?.type || 'S'}</span>
					</label>
					<input 
						type="text"
						id="partitionKeyValue" 
						name="partitionKeyValue"
						placeholder="Enter ${this._tableDetails.partitionKey?.name || 'partition key'} value"
						required>
				</div>

				${this._tableDetails.sortKey ? `
				<!-- Sort Key -->
				<div class="field-group">
					<label class="field-label">
						${this._tableDetails.sortKey.name}
						<span class="required">*</span>
						<span class="key-badge">🔑 Sort Key</span>
						<span class="key-badge">${this._tableDetails.sortKey.type}</span>
					</label>
					<input 
						type="text"
						id="sortKeyValue" 
						name="sortKeyValue"
						placeholder="Enter ${this._tableDetails.sortKey.name} value"
						required>
				</div>
				` : ''}
			</div>

			<!-- Additional Attributes Section -->
			<div class="section">
				<div class="section-title">Additional Attributes (Optional)</div>
				<div id="attributesContainer"></div>
				<button type="button" class="btn-secondary add-attribute-btn" id="addAttributeBtn">
					➕ Add Attribute
				</button>
			</div>

			<!-- Action Buttons -->
			<div class="button-group">
				<button type="button" id="cancelBtn" class="btn-secondary">Cancel</button>
				<button type="submit" id="submitBtn" class="btn-primary">Add Item</button>
			</div>
		</form>
	</div>

	<script nonce="${nonce}">
		const vscode = acquireVsCodeApi();
		
		const tableDetails = ${JSON.stringify(this._tableDetails)};
		let attributeCounter = 0;

		// Add attribute functionality
		document.getElementById('addAttributeBtn').addEventListener('click', () => {
			addAttributeRow();
		});

		function addAttributeRow() {
			const container = document.getElementById('attributesContainer');
			const row = document.createElement('div');
			row.className = 'attribute-row';
			row.id = 'attr-row-' + attributeCounter;
			
			row.innerHTML = \`
				<input 
					type="text"
					placeholder="Attribute name"
					name="attrName\${attributeCounter}">
				<select name="attrType\${attributeCounter}">
					<option value="S">String (S)</option>
					<option value="N">Number (N)</option>
					<option value="BOOL">Boolean (BOOL)</option>
					<option value="NULL">Null (NULL)</option>
					<option value="M">Map (M)</option>
					<option value="L">List (L)</option>
					<option value="SS">String Set (SS)</option>
					<option value="NS">Number Set (NS)</option>
					<option value="BS">Binary Set (BS)</option>
					<option value="B">Binary (B)</option>
				</select>
				<input 
					type="text"
					placeholder="Value"
					name="attrValue\${attributeCounter}">
				<button 
					type="button"
					class="btn-icon" 
					aria-label="Remove attribute"
					onclick="removeAttributeRow('attr-row-\${attributeCounter}')">
					🗑️
				</button>
			\`;
			
			container.appendChild(row);
			attributeCounter++;
		}

		window.removeAttributeRow = function(rowId) {
			const row = document.getElementById(rowId);
			if (row) {
				row.remove();
			}
		};

		// Form submission
		document.getElementById('addItemForm').addEventListener('submit', async (e) => {
			e.preventDefault();
			
			const errorMessage = document.getElementById('errorMessage');
			errorMessage.classList.remove('show');
			
			try {
				const item = {};
				
				// Add partition key
				const partitionKeyValue = document.getElementById('partitionKeyValue').value;
				if (!partitionKeyValue) {
					showError('Partition key value is required');
					return;
				}
				
				item[tableDetails.partitionKey.name] = {
					type: tableDetails.partitionKey.type,
					value: partitionKeyValue
				};
				
				// Add sort key if exists
				if (tableDetails.sortKey) {
					const sortKeyValue = document.getElementById('sortKeyValue').value;
					if (!sortKeyValue) {
						showError('Sort key value is required');
						return;
					}
					
					item[tableDetails.sortKey.name] = {
						type: tableDetails.sortKey.type,
						value: sortKeyValue
					};
				}
				
				// Add additional attributes
				const attributeRows = document.querySelectorAll('.attribute-row');
				attributeRows.forEach((row) => {
					const nameField = row.querySelector('[name^="attrName"]');
					const typeField = row.querySelector('[name^="attrType"]');
					const valueField = row.querySelector('[name^="attrValue"]');
					
					const name = nameField?.value?.trim();
					const type = typeField?.value || 'S';
					const value = valueField?.value;
					
					if (name && value !== undefined && value !== '') {
						item[name] = {
							type: type,
							value: value
						};
					}
				});
				
				// Send to extension
				vscode.postMessage({
					command: 'addItem',
					item: item
				});
				
			} catch (error) {
				showError(error.message || 'An error occurred');
			}
		});

		// Cancel button
		document.getElementById('cancelBtn').addEventListener('click', () => {
			vscode.postMessage({ command: 'cancel' });
		});

		// Handle messages from extension
		window.addEventListener('message', event => {
			const message = event.data;
			switch (message.command) {
				case 'error':
					showError(message.message);
					break;
			}
		});

		function showError(message) {
			const errorMessage = document.getElementById('errorMessage');
			errorMessage.textContent = message;
			errorMessage.classList.add('show');
			errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	</script>
</body>
</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
