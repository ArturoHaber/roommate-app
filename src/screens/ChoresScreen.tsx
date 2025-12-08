import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ChoreCard, Card, Avatar } from '../components';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useHouseholdStore } from '../stores/useHouseholdStore';
import { useChoreStore } from '../stores/useChoreStore';

type FilterType = 'all' | 'mine' | 'today' | 'overdue';

export const ChoresScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  const { user } = useAuthStore();
  const { members } = useHouseholdStore();
  const { 
    assignments, 
    getChoreById, 
    completeChore,
    getMyAssignments,
    getOverdueAssignments,
  } = useChoreStore();

  if (!user) return null;

  const getUserById = (id: string) => members.find(m => m.id === id);

  const getFilteredAssignments = () => {
    const incomplete = assignments.filter(a => !a.completedAt);
    
    switch (activeFilter) {
      case 'mine':
        return incomplete.filter(a => a.assignedTo === user.id);
      case 'today':
        const today = new Date();
        return incomplete.filter(a => {
          const dueDate = new Date(a.dueDate);
          return dueDate.toDateString() === today.toDateString();
        });
      case 'overdue':
        return getOverdueAssignments(user.id);
      default:
        return incomplete;
    }
  };

  const filteredAssignments = getFilteredAssignments();
  const myOverdue = getOverdueAssignments(user.id);

  const handleCompleteChore = (assignmentId: string) => {
    completeChore(assignmentId, user.id);
  };

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'mine', label: 'Mine', count: getMyAssignments(user.id).length },
    { key: 'today', label: 'Today' },
    { key: 'overdue', label: 'Overdue', count: myOverdue.length },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chores</Text>
        <TouchableOpacity style={styles.addButton}>
          <Feather name="plus" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              activeFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Text style={[
              styles.filterText,
              activeFilter === filter.key && styles.filterTextActive,
            ]}>
              {filter.label}
            </Text>
            {filter.count !== undefined && filter.count > 0 && (
              <View style={[
                styles.filterBadge,
                activeFilter === filter.key && styles.filterBadgeActive,
                filter.key === 'overdue' && styles.filterBadgeOverdue,
              ]}>
                <Text style={[
                  styles.filterBadgeText,
                  activeFilter === filter.key && styles.filterBadgeTextActive,
                ]}>
                  {filter.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chore List */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Overdue Warning */}
        {myOverdue.length > 0 && activeFilter !== 'overdue' && (
          <Card style={styles.overdueWarning}>
            <View style={styles.overdueContent}>
              <View style={styles.overdueIcon}>
                <Feather name="alert-circle" size={20} color={COLORS.error} />
              </View>
              <View style={styles.overdueText}>
                <Text style={styles.overdueTitle}>
                  {myOverdue.length} overdue task{myOverdue.length > 1 ? 's' : ''}
                </Text>
                <Text style={styles.overdueSubtitle}>
                  Tap to view and complete them
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Assignments by Person */}
        {activeFilter === 'all' ? (
          // Group by person
          members.map((member) => {
            const memberAssignments = filteredAssignments.filter(
              a => a.assignedTo === member.id
            );
            if (memberAssignments.length === 0) return null;

            return (
              <View key={member.id} style={styles.personSection}>
                <View style={styles.personHeader}>
                  <Avatar name={member.name} color={member.avatarColor} size="sm" />
                  <Text style={styles.personName}>
                    {member.id === user.id ? 'Your Tasks' : `${member.name.split(' ')[0]}'s Tasks`}
                  </Text>
                  <View style={styles.taskCount}>
                    <Text style={styles.taskCountText}>{memberAssignments.length}</Text>
                  </View>
                </View>
                
                {memberAssignments.map((assignment) => {
                  const chore = getChoreById(assignment.choreId);
                  if (!chore) return null;
                  
                  return (
                    <ChoreCard
                      key={assignment.id}
                      chore={chore}
                      assignment={assignment}
                      assignedUser={member}
                      onComplete={() => handleCompleteChore(assignment.id)}
                      isMyChore={member.id === user.id}
                    />
                  );
                })}
              </View>
            );
          })
        ) : (
          // Flat list for filtered views
          filteredAssignments.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Feather 
                name={activeFilter === 'overdue' ? 'check-circle' : 'inbox'} 
                size={48} 
                color={COLORS.gray300} 
              />
              <Text style={styles.emptyTitle}>
                {activeFilter === 'overdue' 
                  ? 'No overdue tasks!' 
                  : 'No tasks here'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'overdue'
                  ? "You're all caught up 🎉"
                  : 'Check back later or add a new chore'}
              </Text>
            </Card>
          ) : (
            filteredAssignments.map((assignment) => {
              const chore = getChoreById(assignment.choreId);
              const assignedUser = getUserById(assignment.assignedTo);
              if (!chore || !assignedUser) return null;
              
              return (
                <ChoreCard
                  key={assignment.id}
                  chore={chore}
                  assignment={assignment}
                  assignedUser={assignedUser}
                  onComplete={() => handleCompleteChore(assignment.id)}
                  isMyChore={assignment.assignedTo === user.id}
                />
              );
            })
          )
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray100,
    marginRight: SPACING.sm,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  filterBadge: {
    marginLeft: SPACING.xs,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray300,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeOverdue: {
    backgroundColor: COLORS.error + '20',
  },
  filterBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  filterBadgeTextActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  overdueWarning: {
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
    marginBottom: SPACING.md,
  },
  overdueContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overdueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  overdueText: {
    flex: 1,
  },
  overdueTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.error,
  },
  overdueSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  personSection: {
    marginBottom: SPACING.lg,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  personName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  taskCount: {
    backgroundColor: COLORS.gray200,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  taskCountText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
});
