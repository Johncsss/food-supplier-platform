import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getBestApiEndpoint } from '../utils/apiHelper';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQScreen: React.FC = () => {
  const navigation = useNavigation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [heroTitle, setHeroTitle] = useState('F&Q');
  const [heroDescription, setHeroDescription] = useState('常見問題解答');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        
        // Use API endpoint to avoid Firestore permission issues
        const baseEndpoint = await getBestApiEndpoint();
        if (!baseEndpoint) {
          console.log('No API endpoint available');
          setLoading(false);
          return;
        }

        const response = await fetch(`${baseEndpoint}/api/pages/faq`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (cancelled) {
          setLoading(false);
          return;
        }

        if (!result.success || !result.page) {
          console.log('FAQ page not found or empty');
          setLoading(false);
          return;
        }

        const data = result.page;
        
        if (data.areas?.hero) {
          setHeroTitle(data.areas.hero.title || 'F&Q');
          setHeroDescription(data.areas.hero.description || '常見問題解答');
        }

        if (data.areas?.faq) {
          // Handle array format
          if (Array.isArray(data.areas.faq)) {
            const faqList: FAQItem[] = data.areas.faq
              .filter((q: any) => q && q.question && q.answer)
              .map((q: any) => ({
                question: q.question,
                answer: q.answer,
              }));
            setFaqs(faqList);
          } else {
            // Handle legacy format (q1, q2, q3, etc.)
            const faqList: FAQItem[] = [];
            for (let i = 1; i <= 8; i++) {
              const q = data.areas.faq[`q${i}`];
              if (q && q.question && q.answer) {
                faqList.push({
                  question: q.question,
                  answer: q.answer,
                });
              }
            }
            setFaqs(faqList);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load FAQ content:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>F&Q</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{heroTitle}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <Text style={styles.heroDescription}>{heroDescription}</Text>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          {faqs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="help-circle-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>尚未設定常見問題</Text>
            </View>
          ) : (
            faqs.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <Ionicons
                    name={openIndex === index ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
                {openIndex === index && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))
          )}

          {/* Contact CTA */}
          <View style={styles.ctaContainer}>
            <Text style={styles.ctaTitle}>還有其他問題？</Text>
            <Text style={styles.ctaDescription}>
              如果以上問題無法解答您的疑問，歡迎聯繫我們的客服團隊。
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => {
                const whatsappUrl = 'https://wa.me/85298636938?text=您好，我想查詢。';
                Linking.openURL(whatsappUrl).catch((err) => {
                  console.error('Failed to open WhatsApp:', err);
                });
              }}
            >
              <Text style={styles.ctaButtonText}>聯絡我們</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerPlaceholder: {
    width: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#0B8628',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  faqSection: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#9CA3AF',
  },
  faqItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  ctaContainer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: '#0B8628',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FAQScreen;

