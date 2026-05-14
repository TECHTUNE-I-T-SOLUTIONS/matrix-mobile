import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';

type Incident = {
  id: string;
  name: string;
  status: string;
  impact: string;
  shortlink?: string;
  created_at?: string;
  updated_at?: string;
  monitoring_at?: string;
  resolved_at?: string;
  incident_updates?: Array<{ status?: string; body?: string; created_at?: string }>;
};

type ComponentItem = {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  group?: boolean;
  only_show_if_degraded?: boolean;
  components?: string[];
  updated_at?: string;
};

type SummaryPayload = {
  page?: { name?: string; url?: string; updated_at?: string };
  components?: ComponentItem[];
  incidents?: Incident[];
  status?: { description?: string; indicator?: string };
};

const STATUS_COLORS: Record<string, string> = {
  operational: '#10B981',
  degraded_performance: '#F59E0B',
  partial_outage: '#FB923C',
  major_outage: '#EF4444',
  under_maintenance: '#8B5CF6',
  investigating: '#F59E0B',
  identified: '#FB923C',
  monitoring: '#3B82F6',
  resolved: '#10B981',
  completed: '#10B981',
};

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  return response.json();
};

const NetworkStatusScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const base = 'https://payscribe.statuspage.io/api/v2';
  const query = '?utm_source=matrixtechonolgies.tech';

  const loadStatus = useCallback(async () => {
    try {
      setError('');
      const [summaryData, componentsData, incidentsData] = await Promise.all([
        fetchJson<any>(`${base}/summary.json${query}`),
        fetchJson<any>(`${base}/components.json${query}`),
        fetchJson<any>(`${base}/incidents.json${query}`),
      ]);

      setSummary(summaryData);
      setComponents(Array.isArray(componentsData?.components) ? componentsData.components : []);
      setIncidents(Array.isArray(incidentsData?.incidents) ? incidentsData.incidents : []);
      setLastUpdated(summaryData?.page?.updated_at || new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const timer = setInterval(loadStatus, 60 * 1000);
    return () => clearInterval(timer);
  }, [loadStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStatus();
  };

  const statusIndicator = summary?.status?.indicator || 'unknown';
  const statusLabel = summary?.status?.description || 'Status unavailable';

  const groupedComponents = useMemo(() => {
    const groups: Record<string, ComponentItem[]> = {};
    components.forEach((item) => {
      const groupName = item.group ? item.name : 'Services';
      if (!groups[groupName]) groups[groupName] = [];
      if (!item.group) groups[groupName].push(item);
    });
    return groups;
  }, [components]);

  const renderStatusPill = (status: string) => {
    const color = STATUS_COLORS[status] || theme.primary;
    return (
      <View style={[styles.pill, { backgroundColor: color + '18', borderColor: color }]}>
        <View style={[styles.pillDot, { backgroundColor: color }]} />
        <Text style={[styles.pillText, { color }]}>{status.replace(/_/g, ' ')}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <LinearGradient colors={[theme.primary, theme.primary + 'DD']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerInner}>
          <View style={styles.heroIcon}>
            <Ionicons name="pulse" size={34} color="white" />
          </View>
          <Text style={styles.title}>Network Status</Text>
          <Text style={styles.subtitle}>
            Live service health, outages, and current incidents across the network.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading live status...</Text>
          </View>
        ) : (
          <>
            {error ? (
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.errorTitle, { color: '#EF4444' }]}>Unable to refresh right now</Text>
                <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>{error}</Text>
              </View>
            ) : null}

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Overall Status</Text>
              {renderStatusPill(statusIndicator)}
              <Text style={[styles.sectionBody, { color: theme.textSecondary, marginTop: 12 }]}>
                {statusLabel}
              </Text>
              <Text style={[styles.smallText, { color: theme.textSecondary }]}>
                Last refreshed: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Unknown'}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Current Incidents</Text>
              {incidents.length > 0 ? incidents.map((incident) => (
                <View key={incident.id} style={styles.incidentCard}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.incidentTitle, { color: theme.text }]}>{incident.name}</Text>
                    {renderStatusPill(incident.status || 'unknown')}
                  </View>
                  <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
                    Impact: {incident.impact.replace(/_/g, ' ')}
                  </Text>
                  {incident.shortlink ? (
                    <Text style={[styles.smallText, { color: theme.primary }]}>Ref: {incident.shortlink}</Text>
                  ) : null}
                  {incident.incident_updates?.[0]?.body ? (
                    <Text style={[styles.smallText, { color: theme.textSecondary }]} numberOfLines={3}>
                      Latest update: {incident.incident_updates[0].body}
                    </Text>
                  ) : null}
                </View>
              )) : (
                <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
                  No active incidents are currently reported.
                </Text>
              )}
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Service Components</Text>
              {Object.entries(groupedComponents).map(([groupName, items]) => (
                <View key={groupName} style={{ marginBottom: 14 }}>
                  <Text style={[styles.groupTitle, { color: theme.text }]}>{groupName}</Text>
                  {items.length > 0 ? items.map((component) => (
                    <View key={component.id} style={styles.componentRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.componentName, { color: theme.text }]}>{component.name}</Text>
                        {component.description ? (
                          <Text style={[styles.smallText, { color: theme.textSecondary }]}>
                            {component.description}
                          </Text>
                        ) : null}
                      </View>
                      {renderStatusPill(component.status || 'unknown')}
                    </View>
                  )) : null}
                </View>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>What the Colors Mean</Text>
              <View style={styles.legendRow}>{renderStatusPill('operational')}</View>
              <View style={styles.legendRow}>{renderStatusPill('degraded_performance')}</View>
              <View style={styles.legendRow}>{renderStatusPill('partial_outage')}</View>
              <View style={styles.legendRow}>{renderStatusPill('major_outage')}</View>
              <View style={styles.legendRow}>{renderStatusPill('under_maintenance')}</View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  headerInner: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  smallText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  incidentCard: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
  },
  incidentTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    paddingRight: 8,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  componentName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  legendRow: {
    marginBottom: 10,
  },
});

export default NetworkStatusScreen;
