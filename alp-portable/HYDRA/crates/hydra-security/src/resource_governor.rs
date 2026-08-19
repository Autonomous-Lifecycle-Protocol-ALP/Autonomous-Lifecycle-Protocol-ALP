use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceBudget {
    pub cpu_limit: u32,
    pub memory_mb: u64,
    pub disk_mb: u64,
    pub network_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceUsage {
    pub cpu_used: u32,
    pub memory_used_mb: u64,
    pub disk_used_mb: u64,
    pub allocation_id: String,
}

pub struct ResourceAllocation {
    pub allocation_id: String,
    pub agent_id: String,
    pub budget: ResourceBudget,
    pub usage: ResourceUsage,
}

pub struct ResourceGovernor {
    allocations: HashMap<String, ResourceAllocation>,
    total_cpu: u32,
    total_memory_mb: u64,
    total_disk_mb: u64,
}

impl Default for ResourceGovernor {
    fn default() -> Self {
        Self::new()
    }
}

impl ResourceGovernor {
    pub fn new() -> Self {
        Self {
            allocations: HashMap::new(),
            total_cpu: num_cpus_safe(),
            total_memory_mb: detect_memory_mb(),
            total_disk_mb: detect_disk_mb(),
        }
    }

    pub fn with_limits(cpu: u32, memory_mb: u64, disk_mb: u64) -> Self {
        Self {
            allocations: HashMap::new(),
            total_cpu: cpu,
            total_memory_mb: memory_mb,
            total_disk_mb: disk_mb,
        }
    }

    pub fn allocate(&mut self, agent_id: &str, budget: ResourceBudget) -> Option<String> {
        let allocated_cpu: u32 = self
            .allocations
            .values()
            .map(|a| a.budget.cpu_limit)
            .sum();
        let allocated_mem: u64 = self
            .allocations
            .values()
            .map(|a| a.budget.memory_mb)
            .sum();
        let allocated_disk: u64 = self
            .allocations
            .values()
            .map(|a| a.budget.disk_mb)
            .sum();

        if allocated_cpu + budget.cpu_limit > self.total_cpu {
            return None;
        }
        if allocated_mem + budget.memory_mb > self.total_memory_mb {
            return None;
        }
        if allocated_disk + budget.disk_mb > self.total_disk_mb {
            return None;
        }

        let allocation_id = Uuid::new_v4().to_string();
        let usage = ResourceUsage {
            cpu_used: 0,
            memory_used_mb: 0,
            disk_used_mb: 0,
            allocation_id: allocation_id.clone(),
        };

        self.allocations.insert(
            agent_id.to_string(),
            ResourceAllocation {
                allocation_id: allocation_id.clone(),
                agent_id: agent_id.to_string(),
                budget,
                usage,
            },
        );

        Some(allocation_id)
    }

    pub fn release(&mut self, agent_id: &str) {
        self.allocations.remove(agent_id);
    }

    pub fn get_usage(&self, agent_id: &str) -> Option<ResourceUsage> {
        self.allocations.get(agent_id).map(|a| a.usage.clone())
    }

    pub fn get_budget(&self, agent_id: &str) -> Option<&ResourceBudget> {
        self.allocations.get(agent_id).map(|a| &a.budget)
    }

    pub fn total_allocated_cpu(&self) -> u32 {
        self.allocations.values().map(|a| a.budget.cpu_limit).sum()
    }

    pub fn total_allocated_memory(&self) -> u64 {
        self.allocations.values().map(|a| a.budget.memory_mb).sum()
    }

    pub fn total_allocated_disk(&self) -> u64 {
        self.allocations.values().map(|a| a.budget.disk_mb).sum()
    }

    pub fn available_cpu(&self) -> u32 {
        self.total_cpu.saturating_sub(self.total_allocated_cpu())
    }

    pub fn available_memory(&self) -> u64 {
        self.total_memory_mb.saturating_sub(self.total_allocated_memory())
    }

    pub fn available_disk(&self) -> u64 {
        self.total_disk_mb.saturating_sub(self.total_allocated_disk())
    }
}

fn num_cpus_safe() -> u32 {
    std::thread::available_parallelism()
        .map(|n| n.get() as u32)
        .unwrap_or(4)
}

fn detect_memory_mb() -> u64 {
    if let Ok(content) = std::fs::read_to_string("/proc/meminfo") {
        for line in content.lines() {
            if let Some(rest) = line.strip_prefix("MemTotal:") {
                if let Some(kb_str) = rest.trim().strip_suffix("kB") {
                    if let Ok(kb) = kb_str.trim().parse::<u64>() {
                        return kb / 1024;
                    }
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(installed) = win_memory_mb() {
            return installed;
        }
    }

    8192
}

#[cfg(target_os = "windows")]
fn win_memory_mb() -> Result<u64, ()> {
    extern "system" {
        fn GlobalMemoryStatusEx(lpBuffer: *mut u8) -> i32;
    }
    #[repr(C)]
    struct MemoryStatusEx {
        dw_length: u32,
        dw_memory_load: u32,
        ull_total_phys: u64,
        ull_avail_phys: u64,
        ull_total_virt: u64,
        ull_avail_virtual: u64,
        _ull_reserved: u64,
    }
    let mut status = MemoryStatusEx {
        dw_length: std::mem::size_of::<MemoryStatusEx>() as u32,
        dw_memory_load: 0,
        ull_total_phys: 0,
        ull_avail_phys: 0,
        ull_total_virt: 0,
        ull_avail_virtual: 0,
        _ull_reserved: 0,
    };
    let result = unsafe { GlobalMemoryStatusEx(&mut status as *mut _ as *mut u8) };
    if result != 0 {
        Ok(status.ull_total_phys / (1024 * 1024))
    } else {
        Err(())
    }
}

#[cfg(not(target_os = "windows"))]
fn win_memory_mb() -> Result<u64, ()> {
    Err(())
}

fn detect_disk_mb() -> u64 {
    51200
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resource_governor_allocates_within_limits() {
        let mut gov = ResourceGovernor::with_limits(4, 8192, 51200);
        let budget = ResourceBudget {
            cpu_limit: 2,
            memory_mb: 4096,
            disk_mb: 10240,
            network_enabled: false,
        };
        let id = gov.allocate("agent-01", budget);
        assert!(id.is_some());
        assert_eq!(gov.available_cpu(), 2);
        assert_eq!(gov.available_memory(), 4096);
    }

    #[test]
    fn resource_governor_rejects_over_limit() {
        let mut gov = ResourceGovernor::with_limits(2, 4096, 10240);
        let budget = ResourceBudget {
            cpu_limit: 4,
            memory_mb: 8192,
            disk_mb: 20480,
            network_enabled: false,
        };
        assert!(gov.allocate("agent-01", budget).is_none());
    }

    #[test]
    fn resource_governor_releases_allocation() {
        let mut gov = ResourceGovernor::with_limits(4, 8192, 51200);
        let budget = ResourceBudget {
            cpu_limit: 2,
            memory_mb: 4096,
            disk_mb: 10240,
            network_enabled: false,
        };
        gov.allocate("agent-01", budget).unwrap();
        assert!(gov.get_budget("agent-01").is_some());
        gov.release("agent-01");
        assert!(gov.get_budget("agent-01").is_none());
    }

    #[test]
    fn resource_governor_tracks_multiple_agents() {
        let mut gov = ResourceGovernor::with_limits(4, 8192, 51200);
        let budget = ResourceBudget {
            cpu_limit: 2,
            memory_mb: 4096,
            disk_mb: 10240,
            network_enabled: false,
        };
        gov.allocate("agent-01", budget.clone()).unwrap();
        gov.allocate("agent-02", budget).unwrap();
        assert_eq!(gov.total_allocated_cpu(), 4);
        assert_eq!(gov.total_allocated_memory(), 8192);
    }

    #[test]
    fn resource_governor_get_usage_returns_clone() {
        let mut gov = ResourceGovernor::with_limits(4, 8192, 51200);
        let budget = ResourceBudget {
            cpu_limit: 2,
            memory_mb: 4096,
            disk_mb: 10240,
            network_enabled: false,
        };
        gov.allocate("agent-01", budget).unwrap();
        let usage = gov.get_usage("agent-01").unwrap();
        assert_eq!(usage.allocation_id.len(), 36);
    }
}
