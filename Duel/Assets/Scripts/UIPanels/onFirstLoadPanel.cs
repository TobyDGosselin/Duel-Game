﻿using UnityEngine;
using System.Collections;
using UnityEngine.UI;

public class onFirstLoadPanel : menuPanel {
	private InputField playerNameField;
	private string _playerName = null;
	// Use this for initialization

	public string playerName
	{
		get
		{
			return _playerName;
		}
		set
		{
			_playerName=value;
			playerNameField.text = _playerName;
		}
	}

	protected override void Start()
	{
		base.Start();
		playerNameField = GameObject.Find("EnterNameField").GetComponent<InputField>();
	}

	protected override void ProcessButtonPress(ButtonAction btn)
	{
		switch (btn)
		{
		case ButtonAction.returnToMain:
			if (playerName != "")
			{
				PlayerPrefs.SetString ("playerProfile", playerName);
				PlayerPrefs.SetInt ("wins", 0);
				PlayerPrefs.SetInt ("losses", 0);
				PlayerPrefs.SetInt ("rating", 0);
				// transition to mainpanel

				uiController.instance.ShowPanel(uiController.instance.MainPanel);
				uiController.instance.MainPanel.playerName = PlayerPrefs.GetString ("playerProfile");
			}
			break;
		}
	}

	public void continu()
	{
		ProcessButtonPress(ButtonAction.returnToMain);
	}

	public override void TransitionIn(){
		Debug.Log ("Playername is: " + PlayerPrefs.GetString ("playerProfile"));
		Debug.Log ("og firstload: " + PlayerPrefs.GetInt ("firstLoad"));
		if (PlayerPrefs.GetInt ("firstLoad")!= null)
			PlayerPrefs.SetInt ("firstLoad", (PlayerPrefs.GetInt ("firstLoad")+1));
		else
			PlayerPrefs.SetInt ("firstLoad", 0);

		Debug.Log ("new firstload: " + PlayerPrefs.GetInt ("firstLoad"));
		if ( PlayerPrefs.GetString ("playerProfile") != "" ) {
			uiController.instance.ShowPanel (uiController.instance.MainPanel);
			return;
	}
		base.TransitionIn ();
	}
}