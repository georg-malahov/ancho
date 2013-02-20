#pragma once


class HeartbeatSlave: public CWindowImpl<HeartbeatSlave, CWindow, CWinTraits<WS_POPUP>>
{
public:
  HeartbeatSlave()
  {
    this->Create(HWND_MESSAGE);
  }
  ~HeartbeatSlave()
  {
    this->DestroyWindow();
  }
  unsigned long
  id() const
  { return (unsigned long)this->m_hWnd; }

public:
    DECLARE_WND_CLASS(_T("Ancho::HeartbeatSlave"));
    BEGIN_MSG_MAP(HeartbeatSlave)
    END_MSG_MAP()
};

class HeartbeatMaster
{
public:
  HeartbeatMaster(unsigned long aSlaveId = 0) : mSlaveId(aSlaveId)
  {}

  bool isAlive()const
  {
    return ::IsWindow((HWND)mSlaveId) != FALSE;
  }

protected:
  unsigned long mSlaveId;
};