/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as api from '../common/API';
import * as ui from '../common/UI';

export class EditItemPanel {
	public static currentPanel: EditItemPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];
	private readonly _region: string;
	private readonly _tableName: string;
	private readonly _tableDetails: api.TableDetails;
	private readonly _item: any;
	private readonly _onUpdate: () => void;

	public static async createOrShow(
		extensionUri: vscode.Uri,
		region: string,
		tableName: string,
		tableDetails: api.TableDetails,
		item: any,
		onUpdate: () => void
	) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// Close existing panel if any
		if (EditItemPanel.currentPanel) {
			EditItemPanel.currentPanel._panel.dispose();
		}

		// Create a new panel
		const panel = vscode.window.createWebviewPanel(
			'editDynamodbItem',
			`Edit Item: ${tableName}`,
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		EditItemPanel.currentPanel = new EditItemPanel(panel, extensionUri, region, tableName, tableDetails, item, onUpdate);
	}

	private constructor(
		panel: vscode.WebviewPanel,
		extensionUri: vscode.Uri,
		region: string,
		tableName: string,
		tableDetails: api.TableDetails,
		item: any,
		onUpdate: () => void
	) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._region = region;
		this._tableName = tableName;
		this._tableDetails = tableDetails;
		this._item = item;
		this._onUpdate = onUpdate;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.command) {
					case 'updateItem':
						await this._handleUpdateItem(message.item);
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

	private async _handleUpdateItem(updatedItem: any) {
		try {
			ui.logToOutput('EditItemPanel: Updating item in DynamoDB');
			ui.logToOutput('Updated item data: ' + JSON.stringify(updatedItem, null, 2));

			// Convert the item to DynamoDB format
			const dynamodbItem = this._convertToDynamoDBFormat(updatedItem);
			ui.logToOutput('DynamoDB format: ' + JSON.stringify(dynamodbItem, null, 2));

			// Build key for the item
			const key: any = {};
			key[this._tableDetails.partitionKey!.name] = dynamodbItem[this._tableDetails.partitionKey!.name];
			if (this._tableDetails.sortKey) {
				key[this._tableDetails.sortKey.name] = dynamodbItem[this._tableDetails.sortKey.name];
			}

			// Build update expression for non-key attributes
		const updateExpressionParts: string[] = [];
		const expressionAttributeValues: any = {};
		let valueCounter = 0;

		for (const [attrName, attrValue] of Object.entries(dynamodbItem)) {
			// Skip key attributes
			if (attrName === this._tableDetails.partitionKey!.name) continue;
			if (this._tableDetails.sortKey && attrName === this._tableDetails.sortKey.name) continue;

			const valuePlaceholder = `:val${valueCounter}`;
			
			expressionAttributeValues[valuePlaceholder] = attrValue;
			updateExpressionParts.push(`${attrName} = ${valuePlaceholder}`);
			valueCounter++;
		}

		if (updateExpressionParts.length === 0) {
			this._panel.webview.postMessage({
				command: 'error',
				message: 'No attributes to update (only key attributes present)'
			});
			return;
		}

		const updateExpression = 'SET ' + updateExpressionParts.join(', ');

		// Update the item
		const result = await api.UpdateItem(
			this._region,
			this._tableName,
			key,
			updateExpression,
			expressionAttributeValues
		);

			if (result.isSuccessful) {
				ui.showInfoMessage('Item updated successfully!');
				// Call the update callback
				this._onUpdate();
				// Close the panel on success
				this._panel.dispose();
			} else {
				this._panel.webview.postMessage({
					command: 'error',
					message: result.error?.message || 'Failed to update item'
				});
			}
		} catch (error: any) {
			ui.logToOutput('EditItemPanel: Error updating item', error);
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
		EditItemPanel.currentPanel = undefined;

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

	private _extractAttributeInfo(item: any): Array<{name: string, type: string, value: any, isKey: boolean}> {
		const attributes: Array<{name: string, type: string, value: any, isKey: boolean}> = [];
		
		for (const [attrName, attrValue] of Object.entries(item)) {
			const dynamoValue = attrValue as any;
			const type = Object.keys(dynamoValue)[0];
			const value = dynamoValue[type];
			
			const isPartitionKey = attrName === this._tableDetails.partitionKey?.name;
		const isSortKey = !!(this._tableDetails.sortKey && attrName === this._tableDetails.sortKey.name);
		const isKey = isPartitionKey || isSortKey;
		
		attributes.push({ name: attrName, type, value, isKey });
		}
		
		// Sort attributes: Partition Key, Sort Key, then others
		const partitionKey = this._tableDetails.partitionKey?.name;
		const sortKey = this._tableDetails.sortKey?.name;

		attributes.sort((a, b) => {
			if (a.name === partitionKey) return -1;
			if (b.name === partitionKey) return 1;
			if (a.name === sortKey) return -1;
			if (b.name === sortKey) return 1;
			return a.name.localeCompare(b.name);
		});

		return attributes;
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const nonce = getNonce();
		const attributes = this._extractAttributeInfo(this._item);

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
	<title>Edit Item: ${this._tableName}</title>
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
		.key-badge {
			display: inline-block;
			padding: 2px 8px;
			margin-left: 8px;
			font-size: 11px;
			background-color: var(--vscode-badge-background);
			color: var(--vscode-badge-foreground);
			border-radius: 3px;
		}
		.readonly-badge {
			background-color: var(--vscode-inputValidation-warningBackground);
			color: var(--vscode-foreground);
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
		input[type="text"]:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
		input:focus, select:focus {
			outline: 1px solid var(--vscode-focusBorder);
			border-color: var(--vscode-focusBorder);
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
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Edit Item</h1>
			<div class="subtitle">Table: ${this._tableName} | Region: ${this._region}</div>
		</div>

		<div class="error-message" id="errorMessage"></div>

		<form id="editItemForm">
			<div class="section">
				<div class="section-title">Attributes</div>
				
				${attributes.map((attr, index) => `
				<div class="field-group">
					<label class="field-label">
						${attr.name}
						<span class="key-badge">${attr.type}</span>
						${attr.isKey ? '<span class="key-badge readonly-badge">🔑 Read-only (Key)</span>' : ''}
					</label>
					<input 
						type="text"
						id="attr_${index}"
						data-name="${attr.name}"
						data-type="${attr.type}"
						value="${this._escapeHtml(String(attr.value))}"
						${attr.isKey ? 'disabled' : ''}
						placeholder="Enter value">
				</div>
				`).join('')}
			</div>

			<div class="button-group">
				<button type="button" id="cancelBtn" class="btn-secondary">Cancel</button>
				<button type="submit" id="submitBtn" class="btn-primary">💾 Update Item</button>
			</div>
		</form>
	</div>

	<script nonce="${nonce}">
		const vscode = acquireVsCodeApi();
		const tableDetails = ${JSON.stringify(this._tableDetails)};

		// Form submission
		document.getElementById('editItemForm').addEventListener('submit', async (e) => {
			e.preventDefault();
			
			const errorMessage = document.getElementById('errorMessage');
			errorMessage.classList.remove('show');
			
			try {
				const item = {};
				
				// Collect all attributes
				const inputs = document.querySelectorAll('input[data-name]');
				inputs.forEach(input => {
					const name = input.getAttribute('data-name');
					const type = input.getAttribute('data-type');
					const value = input.value;
					
					if (name && value !== undefined && value !== '') {
						item[name] = {
							type: type,
							value: value
						};
					}
				});
				
				// Send to extension
				vscode.postMessage({
					command: 'updateItem',
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

	private _escapeHtml(text: string): string {
		const map: { [key: string]: string } = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		return text.replace(/[&<>"']/g, m => map[m]);
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
