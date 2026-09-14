pub struct KillSwitch {
    pub active: bool,
}

impl KillSwitch {
    pub fn new() -> Self {
        Self { active: true }
    }

    pub fn trigger(&mut self) {
        self.active = false;
    }

    pub fn is_active(&self) -> bool {
        self.active
    }
}

impl Default for KillSwitch {
    fn default() -> Self {
        Self::new()
    }
}
