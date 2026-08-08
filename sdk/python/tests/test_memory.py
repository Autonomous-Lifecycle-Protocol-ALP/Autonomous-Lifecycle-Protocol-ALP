import os
import sys
import unittest

SDK_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SDK_ROOT not in sys.path:
    sys.path.insert(0, SDK_ROOT)

from alp_sdk import MemoryStore, MemoryEntry, MemoryGraph, MemoryConsolidator


class TestMemoryStore(unittest.TestCase):
    def setUp(self):
        self.root = os.path.join(SDK_ROOT, '.tmp-alp-memory-tests')
        os.makedirs(self.root, exist_ok=True)
        self.store = MemoryStore(self.root)

    def tearDown(self):
        for name in os.listdir(self.root):
            os.remove(os.path.join(self.root, name))

    def test_stores_and_retrieves_entries(self):
        entry = self.store.store(MemoryEntry(
            id='mem-1', type='decision', key='db-choice', value='postgres', scope='project', importance='high'
        ))
        self.assertEqual(entry.id, 'mem-1')
        all_entries = self.store.get_all()
        self.assertEqual(len(all_entries), 1)
        self.assertEqual(all_entries[0].value, 'postgres')

    def test_retrieves_by_type(self):
        self.store.store(MemoryEntry(id='m1', type='decision', key='k1', value='v1', importance='high'))
        self.store.store(MemoryEntry(id='m2', type='error', key='k2', value='v2', importance='high'))
        filtered = [e for e in self.store.get_all() if e.type == 'decision']
        self.assertEqual(len(filtered), 1)
        self.assertEqual(filtered[0].id, 'm1')

    def test_rag_retrieval_returns_citations(self):
        self.store.store(MemoryEntry(id='m1', type='decision', key='database', value='postgres', scope='project', importance='high'))
        self.store.store(MemoryEntry(id='m2', type='task', key='frontend', value='react', scope='project', importance='medium'))
        results = self.store.retrieve_rag('database postgres')
        self.assertTrue(len(results) >= 1)
        self.assertEqual(results[0]['entry'].id, 'm1')
        self.assertIn('project', results[0]['citation'])

    def test_consolidate_groups_by_scope(self):
        self.store.store(MemoryEntry(id='m1', type='decision', key='k1', value='v1', scope='alpha', importance='high'))
        self.store.store(MemoryEntry(id='m2', type='error', key='k2', value='v2', scope='alpha', importance='low'))
        results = self.store.consolidate()
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['source_ids'], ['m1', 'm2'])
        self.assertIn('v1', results[0]['summary'])


class TestMemoryGraph(unittest.TestCase):
    def test_adds_nodes_and_relates(self):
        graph = MemoryGraph()
        graph.add_node(MemoryEntry(id='a', type='decision', key='k1', value='v1', importance='high', created='', updated=''))
        graph.add_node(MemoryEntry(id='b', type='task', key='k2', value='v2', importance='high', created='', updated=''))
        graph.relate('a', 'b', 'depends_on', 0.9)
        neighbors = graph.neighbors('a')
        self.assertEqual(len(neighbors), 1)
        self.assertEqual(neighbors[0].id, 'b')

    def test_relate_missing_node_raises(self):
        graph = MemoryGraph()
        graph.add_node(MemoryEntry(id='a', type='decision', key='k1', value='v1', importance='high', created='', updated=''))
        with self.assertRaises(ValueError):
            graph.relate('a', 'missing', 'depends_on')


class TestMemoryConsolidator(unittest.TestCase):
    def test_consolidates_entries_by_scope(self):
        consolidator = MemoryConsolidator()
        entries = [
            MemoryEntry(id='m1', type='decision', key='k1', value='v1', scope='alpha', importance='high'),
            MemoryEntry(id='m2', type='error', key='k2', value='v2', scope='alpha', importance='low'),
        ]
        results = consolidator.consolidate(entries)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['source_ids'], ['m1', 'm2'])
        self.assertIn('v1', results[0]['summary'])
