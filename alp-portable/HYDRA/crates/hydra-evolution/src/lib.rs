use std::collections::HashMap;

pub struct EvolutionLab {
    pub generations: Vec<Generation>,
    pub best_fitness: f64,
}

pub struct Generation {
    pub id: u32,
    pub candidates: Vec<Candidate>,
}

pub struct Candidate {
    pub id: String,
    pub fitness: f64,
    pub traits: HashMap<String, String>,
}

impl EvolutionLab {
    pub fn new() -> Self {
        Self { generations: Vec::new(), best_fitness: 0.0 }
    }

    pub fn evaluate(&mut self, candidate: Candidate) {
        if candidate.fitness > self.best_fitness {
            self.best_fitness = candidate.fitness;
        }
    }

    pub fn next_generation(&mut self) {
        let id = self.generations.len() as u32 + 1;
        self.generations.push(Generation { id, candidates: Vec::new() });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn evolution_tracks_best_fitness() {
        let mut lab = EvolutionLab::new();
        let mut traits = std::collections::HashMap::new();
        traits.insert("speed".into(), "fast".into());
        lab.evaluate(Candidate { id: "c1".into(), fitness: 0.5, traits: traits.clone() });
        assert_eq!(lab.best_fitness, 0.5);
        lab.evaluate(Candidate { id: "c2".into(), fitness: 0.9, traits });
        assert_eq!(lab.best_fitness, 0.9);
    }

    #[test]
    fn evolution_creates_generations() {
        let mut lab = EvolutionLab::new();
        lab.next_generation();
        assert_eq!(lab.generations.len(), 1);
        assert_eq!(lab.generations[0].id, 1);
        lab.next_generation();
        assert_eq!(lab.generations[1].id, 2);
    }
}
