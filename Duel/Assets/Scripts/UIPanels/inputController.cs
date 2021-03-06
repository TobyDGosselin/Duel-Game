﻿using UnityEngine;
using System.Collections;

public class inputController : MonoBehaviour {
	#region Singleton
    private static inputController _instance;
    //This is the public reference that other classes will use
    public static inputController instance
    {
        get
        {
            if (_instance == null)
                _instance = GameObject.FindObjectOfType<inputController>();
            return _instance;
        }
    }
	#endregion

	private bool isTouching= false; 
	public void DisableInput(){
        enabled = false;
    }

	public void EnableInput(){
        enabled = true;
    }
    private void HandleInput()
    {
        Debug.Log("input!");
        gameController.instance.processPlayerAction();
    }

	// Update is called once per frame
	void Update() {
		if (isTouching==false && (Input.touchCount > 0 || Input.GetMouseButtonDown(0) || Input.GetKeyDown(KeyCode.Space))){
			isTouching=true; 
			//run method that processes input
            HandleInput();
		}
		if (isTouching==true && (Input.touchCount==0 || Input.GetMouseButtonUp (0)==false|| Input.GetKeyDown(KeyCode.Space))){
			isTouching= false; 	
	    }
    }
}
