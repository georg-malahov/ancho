// dllmain.cpp : Implementation of DllMain.

#include "AnchoShared/stdafx.h"
#include "AnchoShared/resource.h"
#include "AnchoShared_i.h"
#include "AnchoShared/dllmain.h"


CAnchoSharedModule _AtlModule;

// DLL Entry Point
extern "C" BOOL WINAPI DllMain(HINSTANCE hInstance, DWORD dwReason, LPVOID lpReserved)
{
#ifdef _MERGE_PROXYSTUB
	if (!PrxDllMain(hInstance, dwReason, lpReserved))
		return FALSE;
#endif
	hInstance;
	return _AtlModule.DllMain(dwReason, lpReserved);
}
