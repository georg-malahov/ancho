// dllmain.h : Declaration of module class.

class CAnchoSharedModule : public CAtlDllModuleT< CAnchoSharedModule >
{
public :
	DECLARE_LIBID(LIBID_AnchoSharedLib)
	DECLARE_REGISTRY_APPID_RESOURCEID(IDR_ANCHOSHARED, "{3449AC11-8748-4017-AEF0-55C8AD3520ED}")
};

extern class CAnchoSharedModule _AtlModule;
