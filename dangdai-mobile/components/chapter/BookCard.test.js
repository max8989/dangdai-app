System.register(["react/jsx-runtime", "@testing-library/react-native", "./BookCard"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, BookCard_1, mockBook, mockProgress, mockEmptyProgress, mockFullProgress;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (BookCard_1_1) {
                BookCard_1 = BookCard_1_1;
            }
        ],
        execute: function () {
            // Mock Tamagui components before importing BookCard
            jest.mock('tamagui', () => {
                const { View, Text, TouchableOpacity } = require('react-native');
                // Create Progress mock with Indicator property
                const ProgressMock = ({ children, testID, value }) => (_jsx(View, { testID: testID, accessibilityValue: { now: value }, children: children }));
                ProgressMock.Indicator = () => null;
                return {
                    Card: ({ children, onPress, testID, accessibilityRole, accessibilityLabel, }) => (_jsx(TouchableOpacity, { testID: testID, onPress: onPress, accessibilityRole: accessibilityRole, accessibilityLabel: accessibilityLabel, children: _jsx(View, { children: children }) })),
                    XStack: ({ children }) => _jsx(View, { children: children }),
                    YStack: ({ children, testID }) => _jsx(View, { testID: testID, children: children }),
                    Text: ({ children, testID }) => _jsx(Text, { testID: testID, children: children }),
                    Progress: ProgressMock,
                };
            });
            // Mock lucide icons
            jest.mock('@tamagui/lucide-icons', () => ({
                ChevronRight: () => null,
            }));
            mockBook = {
                id: 1,
                title: 'Book 1',
                titleChinese: '當代中文課程 第一冊',
                chapterCount: 15,
                coverColor: '$blue9',
            };
            mockProgress = {
                bookId: 1,
                chaptersCompleted: 5,
                totalChapters: 15,
            };
            mockEmptyProgress = {
                bookId: 1,
                chaptersCompleted: 0,
                totalChapters: 15,
            };
            mockFullProgress = {
                bookId: 1,
                chaptersCompleted: 15,
                totalChapters: 15,
            };
            describe('BookCard', () => {
                const mockOnPress = jest.fn();
                beforeEach(() => {
                    mockOnPress.mockClear();
                });
                describe('rendering', () => {
                    it('renders book title correctly', () => {
                        const { getByTestId } = react_native_1.render(_jsx(BookCard_1.BookCard, { book: mockBook, progress: mockProgress, onPress: mockOnPress }));
                        expect(getByTestId('book-title-1')).toHaveTextContent('Book 1');
                    });
                    it('renders Chinese title correctly', () => {
                        const { getByTestId } = react_native_1.render(_jsx(BookCard_1.BookCard, { book: mockBook, progress: mockProgress, onPress: mockOnPress }));
                        expect(getByTestId('book-title-chinese-1')).toHaveTextContent('當代中文課程 第一冊');
                    });
                    it('renders book number on cover', () => {
                        const { getByTestId } = react_native_1.render(_jsx(BookCard_1.BookCard, { book: mockBook, progress: mockProgress, onPress: mockOnPress }));
                        const cover = getByTestId('book-cover-1');
                        expect(cover).toBeTruthy();
                    });
                    it('renders progress text with correct format', () => {
                        const { getByTestId } = react_native_1.render(_jsx(BookCard_1.BookCard, { book: mockBook, progress: mockProgress, onPress: mockOnPress }));
                        expect(getByTestId('book-progress-text-1')).toHaveTextContent('5/15');
                    });
                });
                describe('progress states', () => {
                    it('displays 0/X for empty progress', () => {
                        const { getByTestId } = react_native_1.render(_jsx(BookCard_1.BookCard, { book: mockBook, progress: mockEmptyProgress, onPress: mockOnPress }));
                        expect(getByTestId('book-progress-text-1')).toHaveTextContent('0/15');
                    });
                    it('displays X/X for completed book', () => {
                        const { getByTestId } = react_native_1.render(_jsx(BookCard_1.BookCard, { book: mockBook, progress: mockFullProgress, onPress: mockOnPress }));
                        expect(getByTestId('book-progress-text-1')).toHaveTextContent('15/15');
                    });
                    it('renders progress bar', () => {
                        const { getByTestId } = react_native_1.render(_jsx(BookCard_1.BookCard, { book: mockBook, progress: mockProgress, onPress: mockOnPress }));
                        expect(getByTestId('book-progress-bar-1')).toBeTruthy();
                    });
                });
                describe('interaction', () => {
                    it('calls onPress when card is tapped', () => {
                        const { getByTestId } = react_native_1.render(_jsx(BookCard_1.BookCard, { book: mockBook, progress: mockProgress, onPress: mockOnPress }));
                        react_native_1.fireEvent.press(getByTestId('book-card-1'));
                        expect(mockOnPress).toHaveBeenCalledTimes(1);
                    });
                });
                describe('accessibility', () => {
                    it('has button role for accessibility', () => {
                        const { getByTestId } = react_native_1.render(_jsx(BookCard_1.BookCard, { book: mockBook, progress: mockProgress, onPress: mockOnPress }));
                        const card = getByTestId('book-card-1');
                        expect(card.props.accessibilityRole).toBe('button');
                    });
                    it('has descriptive accessibility label', () => {
                        const { getByTestId } = react_native_1.render(_jsx(BookCard_1.BookCard, { book: mockBook, progress: mockProgress, onPress: mockOnPress }));
                        const card = getByTestId('book-card-1');
                        expect(card.props.accessibilityLabel).toBe('Book 1, 5 of 15 chapters completed');
                    });
                });
                describe('edge cases', () => {
                    it('handles zero total chapters without division by zero', () => {
                        const zeroChaptersProgress = {
                            bookId: 1,
                            chaptersCompleted: 0,
                            totalChapters: 0,
                        };
                        // Should not throw
                        expect(() => react_native_1.render(_jsx(BookCard_1.BookCard, { book: mockBook, progress: zeroChaptersProgress, onPress: mockOnPress }))).not.toThrow();
                    });
                });
            });
        }
    };
});
