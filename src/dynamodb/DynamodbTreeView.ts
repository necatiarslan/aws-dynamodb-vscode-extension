/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { DynamodbTreeItem, TreeItemType } from './DynamodbTreeItem';
import { DynamodbTreeDataProvider } from './DynamodbTreeDataProvider';
import * as ui from '../common/UI';
import * as api from '../common/API';
import { CloudWatchLogView } from '../cloudwatch/CloudWatchLogView';

export class DynamodbTreeView {

	public static Current: DynamodbTreeView;
	public view: vscode.TreeView<DynamodbTreeItem>;
	public treeDataProvider: DynamodbTreeDataProvider;
	public context: vscode.ExtensionContext;
	public FilterString: string = "";
	public isShowOnlyFavorite: boolean = false;
	public isShowHiddenNodes: boolean = false;
	public AwsProfile: string = "default";	
	public AwsEndPoint: string | undefined;
	public DynamodbList: {Region: string, Dynamodb: string}[] = [];
	public CodePathList: {Region: string, Dynamodb: string, CodePath: string}[] = [];
	public PayloadPathList: {Region: string, Dynamodb: string, PayloadPath: string}[] = [];


	constructor(context: vscode.ExtensionContext) {
		ui.logToOutput('TreeView.constructor Started');
		DynamodbTreeView.Current = this;
		this.context = context;
		this.LoadState();
		this.treeDataProvider = new DynamodbTreeDataProvider();
		this.view = vscode.window.createTreeView('DynamodbTreeView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
		
		// Listen for tree expansions to load table details
		this.view.onDidExpandElement(async (event) => {
			if (event.element.TreeItemType === TreeItemType.Dynamodb) {
				await this.treeDataProvider.PopulateTableDetails(event.element);
			}
		});
		
		this.Refresh();
		context.subscriptions.push(this.view);
		this.SetFilterMessage();
	}

	async TestAwsConnection(){
		let response = await api.TestAwsCredentials()
		if(response.isSuccessful && response.result){
			ui.logToOutput('Aws Credentials Test Successfull');
			ui.showInfoMessage('Aws Credentials Test Successfull');
		}
		else{
			ui.logToOutput('DynamodbTreeView.TestAwsCredentials Error !!!', response.error);
			ui.showErrorMessage('Aws Credentials Test Error !!!', response.error);
		}
		
		let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
		if(selectedRegion===undefined){ return; }

		response = await api.TestAwsConnection(selectedRegion)
		if(response.isSuccessful && response.result){
			ui.logToOutput('Aws Connection Test Successfull');
			ui.showInfoMessage('Aws Connection Test Successfull');
		}
		else{
			ui.logToOutput('DynamodbTreeView.TestAwsConnection Error !!!', response.error);
			ui.showErrorMessage('Aws Connection Test Error !!!', response.error);
		}
	}

	BugAndNewFeature() {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/necatiarslan/aws-dynamodb-vscode-extension/issues/new'));
	}
	Donate() {
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/sponsors/necatiarslan'));
	}

	Refresh(): void {
		ui.logToOutput('DynamodbTreeView.refresh Started');

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: "Aws Dynamodb: Loading...",
		}, (progress, token) => {
			progress.report({ increment: 0 });

			this.LoadTreeItems();

			return new Promise<void>(resolve => { resolve(); });
		});
	}

	LoadTreeItems(){
		ui.logToOutput('DynamodbTreeView.loadTreeItems Started');
		this.treeDataProvider.Refresh();
		this.SetViewTitle();
	}

	ResetView(): void {
		ui.logToOutput('DynamodbTreeView.resetView Started');
		this.FilterString = '';

		this.treeDataProvider.Refresh();
		this.SetViewTitle();

		this.SaveState();
		this.Refresh();
	}

	async AddToFav(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.AddToFav Started');
		node.IsFav = true;
		node.refreshUI();
	}

	async HideNode(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.HideNode Started');
		node.IsHidden = true;

		this.treeDataProvider.Refresh();
	}

	async UnHideNode(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.UnHideNode Started');
		node.IsHidden = false;
	}

	async DeleteFromFav(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.DeleteFromFav Started');
		node.IsFav = false;
		node.refreshUI();
	}

	async Filter() {
		ui.logToOutput('DynamodbTreeView.Filter Started');
		let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });

		if (filterStringTemp === undefined) { return; }

		this.FilterString = filterStringTemp;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async ShowOnlyFavorite() {
		ui.logToOutput('DynamodbTreeView.ShowOnlyFavorite Started');
		this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async ShowHiddenNodes() {
		ui.logToOutput('DynamodbTreeView.ShowHiddenNodes Started');
		this.isShowHiddenNodes = !this.isShowHiddenNodes;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async SetViewTitle(){
		this.view.title = "Aws Dynamodb";
	}

	SaveState() {
		ui.logToOutput('DynamodbTreeView.saveState Started');
		try {

			this.context.globalState.update('AwsProfile', this.AwsProfile);
			this.context.globalState.update('FilterString', this.FilterString);
			this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
			this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
			this.context.globalState.update('DynamodbList', this.DynamodbList);
			this.context.globalState.update('CodePathList', this.CodePathList);
			this.context.globalState.update('PayloadPathList', this.PayloadPathList);
			this.context.globalState.update('AwsEndPoint', this.AwsEndPoint);

			ui.logToOutput("DynamodbTreeView.saveState Successfull");
		} catch (error) {
			ui.logToOutput("DynamodbTreeView.saveState Error !!!");
		}
	}

	LoadState() {
		ui.logToOutput('DynamodbTreeView.loadState Started');
		try {
			let AwsEndPointTemp: string | undefined = this.context.globalState.get('AwsEndPoint');
			if (AwsEndPointTemp) { this.AwsEndPoint = AwsEndPointTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("DynamodbTreeView.loadState AwsEndPoint Error !!!", error);
			ui.showErrorMessage("Aws Dynamodb Load State AwsEndPoint Error !!!", error);
		}

		try {
			let AwsProfileTemp: string | undefined = this.context.globalState.get('AwsProfile');
			if (AwsProfileTemp) { this.AwsProfile = AwsProfileTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("DynamodbTreeView.loadState AwsProfile Error !!!", error);
			ui.showErrorMessage("Aws Dynamodb Load State AwsProfile Error !!!", error);
		}

		try {
			let filterStringTemp: string | undefined = this.context.globalState.get('FilterString');
			if (filterStringTemp) { this.FilterString = filterStringTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("DynamodbTreeView.loadState FilterString Error !!!", error);
			ui.showErrorMessage("Aws Dynamodb Load State FilterString Error !!!", error);
		}

		try {
			let ShowOnlyFavoriteTemp: boolean | undefined = this.context.globalState.get('ShowOnlyFavorite');
			if (ShowOnlyFavoriteTemp) { this.isShowOnlyFavorite = ShowOnlyFavoriteTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("DynamodbTreeView.loadState Error !!!", error);
			ui.showErrorMessage("Aws Dynamodb Load State Error !!!", error);
		}

		try {
			let ShowHiddenNodesTemp: boolean | undefined = this.context.globalState.get('ShowHiddenNodes');
			if (ShowHiddenNodesTemp) { this.isShowHiddenNodes = ShowHiddenNodesTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("DynamodbTreeView.loadState isShowHiddenNodes Error !!!", error);
			ui.showErrorMessage("Aws Dynamodb Load State isShowHiddenNodes Error !!!", error);
		}

		try {
			let DynamodbListTemp:{Region: string, Dynamodb: string}[] | undefined  = this.context.globalState.get('DynamodbList');
			if(DynamodbListTemp){ this.DynamodbList = DynamodbListTemp; }

			let CodePathListTemp:{Region: string, Dynamodb: string, CodePath: string}[] | undefined  = this.context.globalState.get('CodePathList');
			if(CodePathListTemp){ this.CodePathList = CodePathListTemp; }

			let PayloadPathListTemp:{Region: string, Dynamodb: string, PayloadPath: string}[] | undefined  = this.context.globalState.get('PayloadPathList');
			if(PayloadPathListTemp){ this.PayloadPathList = PayloadPathListTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("DynamodbTreeView.loadState DynamodbList/CodePathList Error !!!", error);
			ui.showErrorMessage("Aws Dynamodb Load State DynamodbList/CodePathList Error !!!", error);
		}

	}

	async SetFilterMessage(){
		if(this.DynamodbList.length > 0)
		{
			this.view.message = 
			await this.GetFilterProfilePrompt()
			+ this.GetBoolenSign(this.isShowOnlyFavorite) + "Fav, " 
			+ this.GetBoolenSign(this.isShowHiddenNodes) + "Hidden, "
			+ this.FilterString;
		}
	}

	async GetFilterProfilePrompt() {
		return "Profile:" + this.AwsProfile + " ";
	}

	GetBoolenSign(variable: boolean){
		return variable ? "✓" : "𐄂";
	}

	async AddDynamodb(){
		ui.logToOutput('DynamodbTreeView.AddDynamodb Started');

		let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
		if(selectedRegion===undefined){ return; }

		let selectedDynamodbName = await vscode.window.showInputBox({ placeHolder: 'Enter Dynamodb Name / Search Text' });
		if(selectedDynamodbName===undefined){ return; }

		var resultDynamodb = await api.GetDynamodbList(selectedRegion, selectedDynamodbName);
		if(!resultDynamodb.isSuccessful){ return; }

		let selectedDynamodbList = await vscode.window.showQuickPick(resultDynamodb.result, {canPickMany:true, placeHolder: 'Select Dynamodb(s)'});
		if(!selectedDynamodbList || selectedDynamodbList.length===0){ return; }

		for(var selectedDynamodb of selectedDynamodbList)
		{
			this.treeDataProvider.AddDynamodb(selectedRegion, selectedDynamodb);
		}
		this.SaveState();
	}

	async RemoveDynamodb(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.RemoveDynamodb Started');
		
		if(node.TreeItemType !== TreeItemType.Dynamodb) { return;}

		this.treeDataProvider.RemoveDynamodb(node.Region, node.Dynamodb);		
		this.SaveState();
	}

	async Goto(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.Goto Started');
		
		if(node.TreeItemType !== TreeItemType.Dynamodb) { return;}

		//vscode.commands.executeCommand('vscode.openWith', vscode.Uri.parse('https://console.aws.amazon.com/dynamodb/home?region=us-east-1#/functions/' + node.Dynamodb), "external");
		ui.showInfoMessage("Work In Progress");
		
	}

	async DynamodbView(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.DynamodbView Started');
		if(node.TreeItemType !== TreeItemType.Dynamodb) { return;}

		ui.showInfoMessage('Work In Progress');
	}

	async TriggerDynamodb(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.TriggerDynamodb Started');
		if(node.IsRunning) { return;}
		//if(node.TreeItemType !== TreeItemType.Dynamodb && node.TreeItemType !== TreeItemType.TriggerSavedPayload) { return;}
		this.SetNodeRunning(node, true);
		let param: {} = {}

		if(node.TreeItemType === TreeItemType.TriggerNoPayload)
		{
			param = {}
		}
		else if(node.TreeItemType === TreeItemType.TriggerFilePayload)
		{
			if(!node.PayloadPath) {
				ui.showWarningMessage('Payload Path is not set');
				this.SetNodeRunning(node, false);
				return; 
			}

			let payload = await vscode.workspace.openTextDocument(node.PayloadPath);
			if(payload===undefined){ 
				ui.showWarningMessage('File not found: ' + node.PayloadPath);
				this.SetNodeRunning(node, false);
				return; 
			}
			if(!api.isJsonString(payload.getText())){
				ui.showWarningMessage('File content is not a valid JSON: ' + node.PayloadPath);
				this.SetNodeRunning(node, false);
				return; 
			}
			param = api.ParseJson(payload.getText())
		}
		else
		{
			let config = await vscode.window.showInputBox({ placeHolder: 'Enter Payload Json or leave empty' });
			if(config===undefined){ return; }
			if(config && !api.isJsonString(config)){
				ui.showInfoMessage('Config should be a valid JSON');
				this.SetNodeRunning(node, false);
				return; 
			}
			if(config)
			{
				param = api.ParseJson(config)
			}
		}
		
		let result = await api.TriggerDynamodb(node.Region, node.Dynamodb, param);
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.TriggerDynamodb Error !!!", result.error);
			ui.showErrorMessage('Trigger Dynamodb Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}
		ui.logToOutput("api.TriggerDynamodb Success !!!");
		ui.logToOutput("RequestId: " + result.result.$metadata.requestId);

		// Convert Uint8Array to string
		const payloadString = new TextDecoder("utf-8").decode(result.result.Payload);
		// Parse the JSON string
		const parsedPayload = JSON.parse(payloadString);
		// Pretty-print the JSON with 2-space indentation
		let payload = JSON.stringify(parsedPayload, null, 2)

		if(result.result && result.result.Payload)
		{
			this.treeDataProvider.AddResponsePayload(node, payloadString);
			ui.logToOutput("api.TriggerDynamodb PayLoad \n" + payload);
		}
		
		ui.showInfoMessage('Dynamodb Triggered Successfully');
		this.SetNodeRunning(node, false);
	}

	private SetNodeRunning(node: DynamodbTreeItem, isRunning: boolean) {
		node.IsRunning = isRunning; node.refreshUI(); this.treeDataProvider.Refresh();
	}

	async ViewLatestLog(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.ViewLatestLog Started');
		if(node.IsRunning) { return; }
		if(node.TreeItemType !== TreeItemType.Dynamodb) { return;}
		this.SetNodeRunning(node, true);
		let resultLogStream = await api.GetLatestDynamodbLogStreamName(node.Region, node.Dynamodb);
		if(!resultLogStream.isSuccessful)
		{
			ui.logToOutput("api.GetLatestDynamodbLogStreamName Error !!!", resultLogStream.error);
			ui.showErrorMessage('Get Dynamodb LogStream Error !!!', resultLogStream.error);
			this.SetNodeRunning(node, false);
			return;
		}
		
		const logGroupName = api.GetDynamodbLogGroupName(node.Dynamodb);
		CloudWatchLogView.Render(this.context.extensionUri, node.Region, logGroupName, resultLogStream.result);
		this.SetNodeRunning(node, false);
	}

	async SelectAwsProfile(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.SelectAwsProfile Started');

		var result = await api.GetAwsProfileList();
		if(!result.isSuccessful){ return; }

		let selectedAwsProfile = await vscode.window.showQuickPick(result.result, {canPickMany:false, placeHolder: 'Select Aws Profile'});
		if(!selectedAwsProfile){ return; }

		this.AwsProfile = selectedAwsProfile;
		this.SaveState();
		this.SetFilterMessage();
	}

	async UpdateAwsEndPoint() {
		ui.logToOutput('DynamodbTreeView.UpdateAwsEndPoint Started');

		let awsEndPointUrl = await vscode.window.showInputBox({ placeHolder: 'Enter Aws End Point URL (Leave Empty To Return To Default)' });
		if(awsEndPointUrl===undefined){ return; }
		if(awsEndPointUrl.length===0) { this.AwsEndPoint = undefined; }
		else
		{
			this.AwsEndPoint = awsEndPointUrl;
		}
		this.SaveState();
		this.Refresh();
	}

	async PrintDynamodb(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.PrintDynamodb Started');
		if(node.TreeItemType !== TreeItemType.Dynamodb) { return;}

		let result = await api.GetDynamodb(node.Region, node.Dynamodb);
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.GetDynamodb Error !!!", result.error);
			ui.showErrorMessage('Get Dynamodb Error !!!', result.error);
			return;
		}
		let jsonString = JSON.stringify(result.result, null, 2);
		ui.ShowTextDocument(jsonString, "json");

	}

	async UpdateDynamodbCodes(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.UpdateDynamodbCodes Started');
		if(node.TreeItemType === TreeItemType.CodePath && node.Parent) { node = node.Parent;}
		if(node.TreeItemType !== TreeItemType.Code) { return;}
		if(node.IsRunning) { return; }
		this.SetNodeRunning(node, true);
		if(!node.CodePath) { 
			ui.showWarningMessage("Please Set Code Path First");
			this.SetNodeRunning(node, false);
			return; 
		}

		let result = await api.UpdateDynamodbCode(node.Region, node.Dynamodb, node.CodePath);
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.UpdateDynamodbCode Error !!!", result.error);
			ui.showErrorMessage('Update Dynamodb Code Error !!!', result.error);
			this.SetNodeRunning(node, false);
			return;
		}
		ui.logToOutput("api.UpdateDynamodbCode Success !!!");
		ui.showInfoMessage('Dynamodb Code Updated Successfully');
		this.SetNodeRunning(node, false);
	}

	async SetCodePath(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.SetCodePath Started');
		if(node.TreeItemType === TreeItemType.CodePath && node.Parent) { node = node.Parent;}
		if(node.TreeItemType !== TreeItemType.Code) { return;}

		const selectedPath = await vscode.window.showOpenDialog({
			canSelectMany: false,
			openLabel: 'Select',
			canSelectFiles: true,
			canSelectFolders: true
		});
		
		if(!selectedPath || selectedPath.length===0){ return; }

		node.CodePath = selectedPath[0].path;
		this.treeDataProvider.AddCodePath(node.Region, node.Dynamodb, node.CodePath);
		this.SaveState();
		ui.logToOutput("Code Path: " + node.CodePath);
		ui.showInfoMessage('Code Path Set Successfully');
	}

	async UnsetCodePath(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.UnsetCodePath Started');
		if(node.TreeItemType === TreeItemType.CodePath && node.Parent) { node = node.Parent;}
		if(node.TreeItemType !== TreeItemType.Code) { return;}

		node.CodePath = undefined
		this.treeDataProvider.RemoveCodePath(node.Region, node.Dynamodb);
		this.SaveState();
		ui.logToOutput("Code Path: " + node.CodePath);
		ui.showInfoMessage('Code Path Removed Successfully');
	}

	async ViewLog(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.ViewLog Started');
		if(node.TreeItemType !== TreeItemType.LogStream) { return;}

		if(!node.LogStreamName) { return; }
		
		const logGroupName = api.GetDynamodbLogGroupName(node.Dynamodb);
		CloudWatchLogView.Render(this.context.extensionUri, node.Region, logGroupName, node.LogStreamName);
	}

	async RefreshLogStreams(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.RefreshLogs Started');
		if(node.IsRunning) { return; }
		if(node.TreeItemType !== TreeItemType.LogGroup) { return;}
		this.SetNodeRunning(node, true);
		let resultLogs = await api.GetLatestDynamodbLogStreams(node.Region, node.Dynamodb);
		if(!resultLogs.isSuccessful)
		{
			ui.logToOutput("api.GetLatestDynamodbLogStreams Error !!!", resultLogs.error);
			ui.showErrorMessage('Get Dynamodb Logs Error !!!', resultLogs.error);
			this.SetNodeRunning(node, false);
			return;
		}
		ui.logToOutput("api.GetLatestDynamodbLogStreams Success !!!");
		this.treeDataProvider.AddLogStreams(node, resultLogs.result)
		ui.showInfoMessage('Dynamodb Logs Retrieved Successfully');
		this.SetNodeRunning(node, false);
	}

	async RemovePayloadPath(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.RemovePayloadPath Started');
		if(node.TreeItemType !== TreeItemType.TriggerFilePayload) { return;}

		this.treeDataProvider.RemovePayloadPath(node);
		this.SaveState();
		ui.showInfoMessage('Payload Path Removed Successfully');
	}

	async AddPayloadPath(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.AddPayloadPath Started');
		if(node.TreeItemType !== TreeItemType.TriggerGroup) { return;}

		const selectedPath = await vscode.window.showOpenDialog({
			canSelectMany: false,
			openLabel: 'Select',
			canSelectFiles: true
		});
		
		if(!selectedPath || selectedPath.length===0){ return; }

		this.treeDataProvider.AddPayloadPath(node, selectedPath[0].path);
		this.SaveState();
		ui.showInfoMessage('Payload Path Added Successfully');
	}

	async ViewResponsePayload(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.ViewResponsePayload Started');
		if(node.TreeItemType !== TreeItemType.ResponsePayload) { return; }
		if(!node.ResponsePayload){ return; }

		const parsedPayload = JSON.parse(node.ResponsePayload);
		let jsonString = JSON.stringify(parsedPayload, null, 2);
		ui.logToOutput(jsonString);
		ui.ShowTextDocument(jsonString, "json");
	}

	async CreateTable() {
		ui.logToOutput('DynamodbTreeView.CreateTable Started');

		// Get region
		let region = await vscode.window.showInputBox({ 
			placeHolder: 'Enter AWS Region (e.g., us-east-1)', 
			value: 'us-east-1' 
		});
		if (!region) { return; }

		// Get table name
		let tableName = await vscode.window.showInputBox({ 
			placeHolder: 'Enter Table Name',
			validateInput: (value) => {
				if (!value || value.length === 0) {
					return 'Table name is required';
				}
				if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
					return 'Table name can only contain alphanumeric characters, dots, hyphens, and underscores';
				}
				return null;
			}
		});
		if (!tableName) { return; }

		// Get partition key name
		let partitionKeyName = await vscode.window.showInputBox({ 
			placeHolder: 'Enter Partition Key Name (e.g., id)',
			prompt: 'The primary key attribute name'
		});
		if (!partitionKeyName) { return; }

		// Get partition key type
		let partitionKeyType = await vscode.window.showQuickPick(['S (String)', 'N (Number)', 'B (Binary)'], {
			placeHolder: 'Select Partition Key Data Type'
		});
		if (!partitionKeyType) { return; }
		partitionKeyType = partitionKeyType.charAt(0); // Extract S, N, or B

		// Ask if sort key is needed
		let needsSortKey = await vscode.window.showQuickPick(['No', 'Yes'], {
			placeHolder: 'Does this table need a Sort Key?'
		});
		
		let sortKeyName, sortKeyType;
		if (needsSortKey === 'Yes') {
			sortKeyName = await vscode.window.showInputBox({ 
				placeHolder: 'Enter Sort Key Name'
			});
			if (!sortKeyName) { return; }

			let sortKeyTypeTemp = await vscode.window.showQuickPick(['S (String)', 'N (Number)', 'B (Binary)'], {
				placeHolder: 'Select Sort Key Data Type'
			});
			if (!sortKeyTypeTemp) { return; }
			sortKeyType = sortKeyTypeTemp.charAt(0);
		}

		// Confirm creation
		let confirm = await vscode.window.showQuickPick(['Yes', 'No'], {
			placeHolder: `Create table "${tableName}" in ${region}?`
		});
		if (confirm !== 'Yes') { return; }

		// Create the table
		let result = await api.CreateDynamodbTable(
			region, 
			tableName, 
			partitionKeyName, 
			partitionKeyType,
			sortKeyName,
			sortKeyType
		);

		if (result.isSuccessful) {
			// Add to tree view
			this.treeDataProvider.AddDynamodb(region, tableName);
			this.SaveState();
			this.Refresh();
		}
	}

	async DeleteTable(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.DeleteTable Started');
		if (node.TreeItemType !== TreeItemType.Dynamodb) { return; }

		// Confirm deletion
		let confirm = await vscode.window.showWarningMessage(
			`Are you sure you want to DELETE table "${node.Dynamodb}" in ${node.Region}? This action CANNOT be undone!`,
			{ modal: true },
			'Delete Table'
		);

		if (confirm !== 'Delete Table') { return; }

		// Double confirmation
		let doubleConfirm = await vscode.window.showInputBox({
			placeHolder: `Type "${node.Dynamodb}" to confirm deletion`,
			prompt: 'This will permanently delete the table and all its data',
			validateInput: (value) => {
				if (value !== node.Dynamodb) {
					return `Please type "${node.Dynamodb}" exactly to confirm`;
				}
				return null;
			}
		});

		if (doubleConfirm !== node.Dynamodb) { return; }

		// Delete the table
		let result = await api.DeleteDynamodbTable(node.Region, node.Dynamodb);
		
		if (result.isSuccessful) {
			this.treeDataProvider.RemoveDynamodb(node.Region, node.Dynamodb);
			this.SaveState();
			this.Refresh();
		}
	}

	async EditCapacity(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.EditCapacity Started');
		if (node.TreeItemType !== TreeItemType.Dynamodb) { return; }

		// Get current capacity settings
		let tableDetails = await api.GetDynamodb(node.Region, node.Dynamodb);
		if (!tableDetails.isSuccessful) { return; }

		let details = api.ExtractTableDetails(tableDetails.result);

		// Ask billing mode
		let billingMode = await vscode.window.showQuickPick(
			['PAY_PER_REQUEST (On-Demand)', 'PROVISIONED'],
			{
				placeHolder: 'Select Billing Mode',
				canPickMany: false
			}
		);
		if (!billingMode) { return; }

		let mode = billingMode.startsWith('PAY_PER_REQUEST') ? 'PAY_PER_REQUEST' : 'PROVISIONED';
		let readCapacity, writeCapacity;

		if (mode === 'PROVISIONED') {
			let readInput = await vscode.window.showInputBox({
				placeHolder: 'Enter Read Capacity Units',
				value: details.readCapacity?.toString() || '5',
				validateInput: (value) => {
					if (!value || isNaN(Number(value)) || Number(value) < 1) {
						return 'Please enter a valid number >= 1';
					}
					return null;
				}
			});
			if (!readInput) { return; }
			readCapacity = Number(readInput);

			let writeInput = await vscode.window.showInputBox({
				placeHolder: 'Enter Write Capacity Units',
				value: details.writeCapacity?.toString() || '5',
				validateInput: (value) => {
					if (!value || isNaN(Number(value)) || Number(value) < 1) {
						return 'Please enter a valid number >= 1';
					}
					return null;
				}
			});
			if (!writeInput) { return; }
			writeCapacity = Number(writeInput);
		}

		let result = await api.UpdateTableCapacity(
			node.Region,
			node.Dynamodb,
			readCapacity,
			writeCapacity,
			mode
		);

		if (result.isSuccessful) {
			this.Refresh();
		}
	}

	async QueryTable(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.QueryTable Started');
		if (node.TreeItemType !== TreeItemType.Dynamodb) { return; }

		// Get table details to know the keys
		let tableDetails = await api.GetDynamodb(node.Region, node.Dynamodb);
		if (!tableDetails.isSuccessful) { return; }

		let details = api.ExtractTableDetails(tableDetails.result);

		if (!details.partitionKey) {
			ui.showErrorMessage('Cannot query: Table schema not found', new Error('Table schema not found'));
			return;
		}

		// Get partition key value
		let partitionKeyValue = await vscode.window.showInputBox({
			placeHolder: `Enter ${details.partitionKey.name} value`,
			prompt: `Partition Key: ${details.partitionKey.name} (${details.partitionKey.type})`
		});
		if (!partitionKeyValue) { return; }

		// Build the key condition expression
		let keyConditionExpression = `${details.partitionKey.name} = :pkval`;
		let expressionAttributeValues: any = {
			':pkval': { [details.partitionKey.type]: partitionKeyValue }
		};

		// If there's a sort key, ask if they want to filter by it
		if (details.sortKey) {
			let useSortKey = await vscode.window.showQuickPick(['No', 'Yes'], {
				placeHolder: `Filter by ${details.sortKey.name}?`
			});

			if (useSortKey === 'Yes') {
				let sortKeyValue = await vscode.window.showInputBox({
					placeHolder: `Enter ${details.sortKey.name} value`,
					prompt: `Sort Key: ${details.sortKey.name} (${details.sortKey.type})`
				});
				if (sortKeyValue) {
					keyConditionExpression += ` AND ${details.sortKey.name} = :skval`;
					expressionAttributeValues[':skval'] = { [details.sortKey.type]: sortKeyValue };
				}
			}
		}

		// Execute query
		let result = await api.QueryTable(
			node.Region,
			node.Dynamodb,
			keyConditionExpression,
			expressionAttributeValues,
			undefined,
			100 // Limit to 100 items
		);

		if (result.isSuccessful) {
			let itemCount = result.result.Items?.length || 0;
			ui.showInfoMessage(`Query returned ${itemCount} item(s)`);
			
			// Show results
			let jsonString = JSON.stringify(result.result.Items, null, 2);
			ui.ShowTextDocument(jsonString, "json");
		}
	}

	async ScanTable(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.ScanTable Started');
		if (node.TreeItemType !== TreeItemType.Dynamodb) { return; }

		// Get limit
		let limitInput = await vscode.window.showInputBox({
			placeHolder: 'Enter maximum number of items to scan (default: 100)',
			value: '100',
			validateInput: (value) => {
				if (!value || isNaN(Number(value)) || Number(value) < 1) {
					return 'Please enter a valid number >= 1';
				}
				return null;
			}
		});
		if (!limitInput) { return; }
		let limit = Number(limitInput);

		// Warn about scan cost
		let confirm = await vscode.window.showWarningMessage(
			`Scanning a table reads every item and can be expensive. Continue with scan of up to ${limit} items?`,
			'Yes', 'No'
		);
		if (confirm !== 'Yes') { return; }

		// Execute scan
		let result = await api.ScanTable(
			node.Region,
			node.Dynamodb,
			limit
		);

		if (result.isSuccessful) {
			let itemCount = result.result.Items?.length || 0;
			ui.showInfoMessage(`Scan returned ${itemCount} item(s)`);
			
			// Show results
			let jsonString = JSON.stringify(result.result.Items, null, 2);
			ui.ShowTextDocument(jsonString, "json");
		}
	}

	async AddItem(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.AddItem Started');
		if (node.TreeItemType !== TreeItemType.Dynamodb) { return; }

		// Get table details to know the key schema
		let tableDetails = await api.GetDynamodb(node.Region, node.Dynamodb);
		if (!tableDetails.isSuccessful) { return; }

		let details = api.ExtractTableDetails(tableDetails.result);

		if (!details.partitionKey) {
			ui.showErrorMessage('Cannot add item: Table schema not found', new Error('Table schema not found'));
			return;
		}

		// Get partition key value
		let partitionKeyValue = await vscode.window.showInputBox({
			placeHolder: `Enter ${details.partitionKey.name} value`,
			prompt: `Partition Key: ${details.partitionKey.name} (${details.partitionKey.type})`
		});
		if (!partitionKeyValue) { return; }

		let item: any = {
			[details.partitionKey.name]: { [details.partitionKey.type]: partitionKeyValue }
		};

		// If there's a sort key, get its value
		if (details.sortKey) {
			let sortKeyValue = await vscode.window.showInputBox({
				placeHolder: `Enter ${details.sortKey.name} value`,
				prompt: `Sort Key: ${details.sortKey.name} (${details.sortKey.type})`
			});
			if (!sortKeyValue) { return; }
			item[details.sortKey.name] = { [details.sortKey.type]: sortKeyValue };
		}

		// Get additional attributes as JSON
		let additionalAttrs = await vscode.window.showInputBox({
			placeHolder: 'Enter additional attributes as JSON (optional)',
			prompt: 'Example: {"name": {"S": "John"}, "age": {"N": "30"}}'
		});

		if (additionalAttrs) {
			try {
				let attrs = JSON.parse(additionalAttrs);
				item = { ...item, ...attrs };
			} catch (error) {
				ui.showErrorMessage('Invalid JSON format for attributes', error as Error);
				return;
			}
		}

		// Add the item
		let result = await api.PutItem(node.Region, node.Dynamodb, item);
		
		if (result.isSuccessful) {
			this.Refresh();
		}
	}

	async EditItem(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.EditItem Started');
		if (node.TreeItemType !== TreeItemType.Dynamodb) { return; }

		ui.showInfoMessage('Edit Item: Please provide the item key and attributes to update');

		// Get table details
		let tableDetails = await api.GetDynamodb(node.Region, node.Dynamodb);
		if (!tableDetails.isSuccessful) { return; }

		let details = api.ExtractTableDetails(tableDetails.result);

		if (!details.partitionKey) {
			ui.showErrorMessage('Cannot edit item: Table schema not found', new Error('Table schema not found'));
			return;
		}

		// Get the key to identify the item
		let partitionKeyValue = await vscode.window.showInputBox({
			placeHolder: `Enter ${details.partitionKey.name} value to identify the item`,
			prompt: `Partition Key: ${details.partitionKey.name} (${details.partitionKey.type})`
		});
		if (!partitionKeyValue) { return; }

		let key: any = {
			[details.partitionKey.name]: { [details.partitionKey.type]: partitionKeyValue }
		};

		if (details.sortKey) {
			let sortKeyValue = await vscode.window.showInputBox({
				placeHolder: `Enter ${details.sortKey.name} value`,
				prompt: `Sort Key: ${details.sortKey.name} (${details.sortKey.type})`
			});
			if (!sortKeyValue) { return; }
			key[details.sortKey.name] = { [details.sortKey.type]: sortKeyValue };
		}

		// Get update expression
		let updateExpression = await vscode.window.showInputBox({
			placeHolder: 'Enter update expression',
			prompt: 'Example: SET #name = :nameVal, #age = :ageVal',
			value: 'SET '
		});
		if (!updateExpression) { return; }

		// Get expression attribute values
		let expressionValues = await vscode.window.showInputBox({
			placeHolder: 'Enter expression attribute values as JSON',
			prompt: 'Example: {":nameVal": {"S": "John"}, ":ageVal": {"N": "31"}}'
		});
		if (!expressionValues) { return; }

		let expressionAttributeValues;
		try {
			expressionAttributeValues = JSON.parse(expressionValues);
		} catch (error) {
			ui.showErrorMessage('Invalid JSON format for expression values', error as Error);
			return;
		}

		// Update the item
		let result = await api.UpdateItem(
			node.Region,
			node.Dynamodb,
			key,
			updateExpression,
			expressionAttributeValues
		);

		if (result.isSuccessful) {
			let jsonString = JSON.stringify(result.result.Attributes, null, 2);
			ui.ShowTextDocument(jsonString, "json");
		}
	}

	async DeleteItem(node: DynamodbTreeItem) {
		ui.logToOutput('DynamodbTreeView.DeleteItem Started');
		if (node.TreeItemType !== TreeItemType.Dynamodb) { return; }

		// Get table details
		let tableDetails = await api.GetDynamodb(node.Region, node.Dynamodb);
		if (!tableDetails.isSuccessful) { return; }

		let details = api.ExtractTableDetails(tableDetails.result);

		if (!details.partitionKey) {
			ui.showErrorMessage('Cannot delete item: Table schema not found', new Error('Table schema not found'));
			return;
		}

		// Get the key to identify the item
		let partitionKeyValue = await vscode.window.showInputBox({
			placeHolder: `Enter ${details.partitionKey.name} value to identify the item to delete`,
			prompt: `Partition Key: ${details.partitionKey.name} (${details.partitionKey.type})`
		});
		if (!partitionKeyValue) { return; }

		let key: any = {
			[details.partitionKey.name]: { [details.partitionKey.type]: partitionKeyValue }
		};

		if (details.sortKey) {
			let sortKeyValue = await vscode.window.showInputBox({
				placeHolder: `Enter ${details.sortKey.name} value`,
				prompt: `Sort Key: ${details.sortKey.name} (${details.sortKey.type})`
			});
			if (!sortKeyValue) { return; }
			key[details.sortKey.name] = { [details.sortKey.type]: sortKeyValue };
		}

		// Confirm deletion
		let confirm = await vscode.window.showWarningMessage(
			'Are you sure you want to delete this item?',
			{ modal: true },
			'Delete Item'
		);
		if (confirm !== 'Delete Item') { return; }

		// Delete the item
		let result = await api.DeleteItem(node.Region, node.Dynamodb, key);
		
		if (result.isSuccessful) {
			this.Refresh();
		}
	}
}
