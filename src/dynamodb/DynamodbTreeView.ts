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
}
