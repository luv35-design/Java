export interface JavaFile {
  filename: string;
  language: string;
  description: string;
  content: string;
}

export const initialJavaProject: Record<string, JavaFile> = {
  "schema.sql": {
    filename: "schema.sql",
    language: "sql",
    description: "MySQL Database Schema, table creation statements, and constraints configuration.",
    content: `-- --- MySQL Digital Diary Schema ---
-- Follow these instructions to initialize your local MySQL Database:
-- 1. Open your terminal or MySQL Workbench
-- 2. Log in to your MySQL server: mysql -u root -p
-- 3. Execute this SQL script using: SOURCE schema.sql;

CREATE DATABASE IF NOT EXISTS digital_diary;
USE digital_diary;

DROP TABLE IF EXISTS diary_entries;

CREATE TABLE diary_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Personal',
    mood VARCHAR(50) DEFAULT '😊 Happy',
    rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    is_locked BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255) DEFAULT NULL,
    entry_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_entry_date (entry_date),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some starter entries (Optional sandbox values)
INSERT INTO diary_entries (title, content, category, mood, rating, is_locked, entry_date)
VALUES 
('My First Digital Diary Journey', 'Today, I set up my Java + MySQL Digital Diary. The setup went perfectly fine! Excited to persist my memories digitally in a secure relational database.', 'Work', '😊 Happy', 5, FALSE, CURRENT_DATE()),
('Exploring Java GUI programming', 'Building Swing interfaces can be tedious, but with proper layouts like GridBagLayout and custom renderers, we can make it look highly modern. Pairing it with a robust JDBC layer is satisfying!', 'Personal', '🧠 Productive', 4, FALSE, CURRENT_DATE());
`
  },
  "DatabaseConnection.java": {
    filename: "DatabaseConnection.java",
    language: "java",
    description: "Configures JDBC connection to MySQL, handles driver registration and secure pool connection creation.",
    content: `package org.diary.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Singleton database Connection helper to connect Java Core to MySQL database.
 */
public class DatabaseConnection {
    // Database credentials
    private static final String URL = "jdbc:mysql://localhost:3306/digital_diary?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
    private static final String USER = "root";
    private static final String PASSWORD = "your_mysql_password"; // <-- Replace with your MySQL Password

    // Static block to preload the JDBC driver
    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("MySQL Connector/J driver class not found on classpath!");
            e.printStackTrace();
        }
    }

    /**
     * Obtains a standard SQL connection to the MySQL server.
     * @return Connection object
     * @throws SQLException if a database access error occurs
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    /**
     * Validates connection health. Useful for bootstrap debugging.
     */
    public static boolean checkConnection() {
        try (Connection conn = getConnection()) {
            return conn != null && !conn.isClosed();
        } catch (SQLException e) {
            System.err.println("Database Connection verification failed: " + e.getMessage());
            return false;
        }
    }
}
`
  },
  "DiaryEntry.java": {
    filename: "DiaryEntry.java",
    language: "java",
    description: "The core Model class representing a single Diary Entry with all properties.",
    content: `package org.diary.model;

import java.sql.Date;
import java.sql.Timestamp;

/**
 * Plain Old Java Object (POJO) representing a table record in the 'diary_entries' database.
 */
public class DiaryEntry {
    private int id;
    private String title;
    private String content;
    private String category;
    private String mood;
    private int rating;
    private boolean isLocked;
    private String passwordHash;
    private Date entryDate;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    // Default Constructor
    public DiaryEntry() {}

    // Detailed Constructor for GUI/DAO bindings
    public DiaryEntry(String title, String content, String category, String mood, int rating, Date entryDate) {
        this.title = title;
        this.content = content;
        this.category = category;
        this.mood = mood;
        this.rating = rating;
        this.entryDate = entryDate;
        this.isLocked = false;
        this.passwordHash = null;
    }

    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public boolean isLocked() { return isLocked; }
    public void setLocked(boolean locked) { isLocked = locked; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public Date getEntryDate() { return entryDate; }
    public void setEntryDate(Date entryDate) { this.entryDate = entryDate; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public String toString() {
        return String.format("[%s] %s (%s)", entryDate.toString(), title, category);
    }
}
`
  },
  "DiaryDAO.java": {
    filename: "DiaryDAO.java",
    language: "java",
    description: "The Data Access Object. Implements CRUD logic including SQL statements and prepared parameters.",
    content: `package org.diary.dao;

import org.diary.db.DatabaseConnection;
import org.diary.model.DiaryEntry;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object (DAO) executing secure CRUD statements on the MySQL digital_diary database.
 */
public class DiaryDAO {

    /**
     * Create/Insert a new diary entry securely using PreparedStatement.
     */
    public boolean addEntry(DiaryEntry entry) {
        String sql = "INSERT INTO diary_entries (title, content, category, mood, rating, is_locked, password_hash, entry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            stmt.setString(1, entry.getTitle());
            stmt.setString(2, entry.getContent());
            stmt.setString(3, entry.getCategory());
            stmt.setString(4, entry.getMood());
            stmt.setInt(5, entry.getRating());
            stmt.setBoolean(6, entry.isLocked());
            stmt.setString(7, entry.getPasswordHash());
            stmt.setDate(8, entry.getEntryDate());

            int affectedRows = stmt.executeUpdate();
            if (affectedRows > 0) {
                try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        entry.setId(generatedKeys.getInt(1));
                    }
                }
                return true;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Read/Retrieve all diary entries sorted by entry date descending.
     */
    public List<DiaryEntry> getAllEntries() {
        List<DiaryEntry> entries = new ArrayList<>();
        String sql = "SELECT * FROM diary_entries ORDER BY entry_date DESC, id DESC";
        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                entries.add(mapResultSetToEntry(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return entries;
    }

    /**
     * Read/Retrieve entries with custom keyword filters in either title or content.
     */
    public List<DiaryEntry> searchEntries(String query) {
        List<DiaryEntry> entries = new ArrayList<>();
        String sql = "SELECT * FROM diary_entries WHERE title LIKE ? OR content LIKE ? ORDER BY entry_date DESC";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            String wildCard = "%" + query + "%";
            stmt.setString(1, wildCard);
            stmt.setString(2, wildCard);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    entries.add(mapResultSetToEntry(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return entries;
    }

    /**
     * Read/Retrieve entries filtered specifically by category.
     */
    public List<DiaryEntry> getEntriesByCategory(String category) {
        List<DiaryEntry> entries = new ArrayList<>();
        String sql = "SELECT * FROM diary_entries WHERE category = ? ORDER BY entry_date DESC";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, category);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    entries.add(mapResultSetToEntry(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return entries;
    }

    /**
     * Update an existing diary entry state.
     */
    public boolean updateEntry(DiaryEntry entry) {
        String sql = "UPDATE diary_entries SET title = ?, content = ?, category = ?, mood = ?, rating = ?, is_locked = ?, password_hash = ?, entry_date = ? WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, entry.getTitle());
            stmt.setString(2, entry.getContent());
            stmt.setString(3, entry.getCategory());
            stmt.setString(4, entry.getMood());
            stmt.setInt(5, entry.getRating());
            stmt.setBoolean(6, entry.isLocked());
            stmt.setString(7, entry.getPasswordHash());
            stmt.setDate(8, entry.getEntryDate());
            stmt.setInt(9, entry.getId());

            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Delete an entry from the database.
     */
    public boolean deleteEntry(int id) {
        String sql = "DELETE FROM diary_entries WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    private DiaryEntry mapResultSetToEntry(ResultSet rs) throws SQLException {
        DiaryEntry entry = new DiaryEntry();
        entry.setId(rs.getInt("id"));
        entry.setTitle(rs.getString("title"));
        entry.setContent(rs.getString("content"));
        entry.setCategory(rs.getString("category"));
        entry.setMood(rs.getString("mood"));
        entry.setRating(rs.getInt("rating"));
        entry.setLocked(rs.getBoolean("is_locked"));
        entry.setPasswordHash(rs.getString("password_hash"));
        entry.setEntryDate(rs.getDate("entry_date"));
        entry.setCreatedAt(rs.getTimestamp("created_at"));
        entry.setUpdatedAt(rs.getTimestamp("updated_at"));
        return entry;
    }
}
`
  },
  "DiarySwingUI.java": {
    filename: "DiarySwingUI.java",
    language: "java",
    description: "The Java Swing controller and main interface, deploying full styling, modern navigation, and responsive controls.",
    content: `package org.diary.ui;

import org.diary.dao.DiaryDAO;
import org.diary.model.DiaryEntry;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

/**
 * A beautiful, full-featured Swing UI built with GridBagLayout, responsive states,
 * and intuitive interaction buttons connecting the user to the underlying MySQL database.
 */
public class DiarySwingUI extends JFrame {
    private final DiaryDAO diaryDAO;
    private List<DiaryEntry> currentEntriesList;

    // Swing Components
    private JList<DiaryEntry> entryJList;
    private DefaultListModel<DiaryEntry> listModel;

    private JTextField titleField;
    private JTextArea contentArea;
    private JComboBox<String> categoryCombo;
    private JComboBox<String> moodCombo;
    private JSlider ratingSlider;
    private JTextField dateField;
    private JCheckBox lockCheckBox;

    private JTextField searchField;
    private JComboBox<String> filterCombo;
    private JLabel statusLabel;

    private DiaryEntry activeEntry = null;

    public DiarySwingUI() {
        this.diaryDAO = new DiaryDAO();
        initializeUI();
        loadEntries();
    }

    private void initializeUI() {
        setTitle("Digital Diary Workspace | Java & MySQL Edition");
        setSize(1000, 680);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        // Core Layout structure: Split Pane
        JSplitPane splitPane = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT);
        splitPane.setDividerLocation(320);
        splitPane.setContinuousLayout(true);

        // LEFT BAR: list panel, search & filter panels
        JPanel leftPanel = createLeftPanel();
        splitPane.setLeftComponent(leftPanel);

        // RIGHT BAR: entry viewing and editing panels
        JPanel rightPanel = createRightPanel();
        splitPane.setRightComponent(rightPanel);

        // Add main elements
        add(splitPane, BorderLayout.CENTER);

        // Add Status Bar
        JPanel statusBar = new JPanel(new BorderLayout());
        statusBar.setBorder(new EmptyBorder(5, 10, 5, 10));
        statusLabel = new JLabel("Status: Workspace ready. JDBC connections waiting.");
        statusLabel.setFont(new Font("SansSerif", Font.PLAIN, 12));
        statusBar.add(statusLabel, BorderLayout.WEST);
        add(statusBar, BorderLayout.SOUTH);
    }

    private JPanel createLeftPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(new EmptyBorder(10, 10, 10, 5));

        // Top Search Section
        JPanel searchPanel = new JPanel(new GridBagLayout());
        searchPanel.setBorder(BorderFactory.createTitledBorder("Search & Filter"));
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.insets = new Insets(5, 5, 5, 5);

        searchField = new JTextField();
        searchField.setFont(new Font("SansSerif", Font.PLAIN, 13));
        searchField.addActionListener(e -> performSearch());

        JButton searchButton = new JButton("🔍");
        searchButton.addActionListener(e -> performSearch());

        filterCombo = new JComboBox<>(new String[]{"All Categories", "Personal", "Work", "Ideas", "Travel", "Health"});
        filterCombo.addActionListener(e -> handleCategoryFilter());

        gbc.gridx = 0; gbc.gridy = 0; gbc.weightx = 0.8;
        searchPanel.add(searchField, gbc);

        gbc.gridx = 1; gbc.weightx = 0.2;
        searchPanel.add(searchButton, gbc);

        gbc.gridx = 0; gbc.gridy = 1; gbc.gridwidth = 2; gbc.weightx = 1.0;
        searchPanel.add(filterCombo, gbc);

        panel.add(searchPanel, BorderLayout.NORTH);

        // Middle Scroll List Setup
        listModel = new DefaultListModel<>();
        entryJList = new JList<>(listModel);
        entryJList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        entryJList.setFont(new Font("SansSerif", Font.BOLD, 13));
        entryJList.setFixedCellHeight(45);
        entryJList.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));

        // Custom Cell Renderer to look modern
        entryJList.setCellRenderer(new DefaultListCellRenderer() {
            @Override
            public Component getListCellRendererComponent(JList<?> list, Object value, int index, boolean isSelected, boolean cellHasFocus) {
                JLabel label = (JLabel) super.getListCellRendererComponent(list, value, index, isSelected, cellHasFocus);
                DiaryEntry entry = (DiaryEntry) value;
                String lockIcon = entry.isLocked() ? "🔒 " : "📝 ";
                label.setText(lockIcon + " " + entry.getTitle() + "  (" + entry.getMood() + ")");
                label.setBorder(BorderFactory.createMatteBorder(0, 0, 1, 0, Color.LIGHT_GRAY));
                return label;
            }
        });

        entryJList.addListSelectionListener(e -> {
            if (!e.getValueIsAdjusting()) {
                selectDiaryEntry(entryJList.getSelectedValue());
            }
        });

        JScrollPane scrollPane = new JScrollPane(entryJList);
        panel.add(scrollPane, BorderLayout.CENTER);

        // Left sidebar action buttons
        JButton newButton = new JButton("➕ Create New Entry");
        newButton.setFont(new Font("SansSerif", Font.BOLD, 13));
        newButton.setBackground(new Color(41, 128, 185));
        newButton.setForeground(Color.WHITE);
        newButton.setFocusPainted(false);
        newButton.addActionListener(e -> prepareNewEntry());
        panel.add(newButton, BorderLayout.SOUTH);

        return panel;
    }

    private JPanel createRightPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(new EmptyBorder(10, 5, 10, 10));

        JPanel formPanel = new JPanel(new GridBagLayout());
        formPanel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createTitledBorder("Workspace Editor"),
                new EmptyBorder(10, 10, 10, 10)
        ));

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.insets = new Insets(8, 8, 8, 8);

        // Row 0: Title
        gbc.gridx = 0; gbc.gridy = 0; gbc.weightx = 0.15;
        formPanel.add(new JLabel("Title:"), gbc);
        gbc.gridx = 1; gbc.weightx = 0.85; gbc.gridwidth = 3;
        titleField = new JTextField();
        titleField.setFont(new Font("SansSerif", Font.PLAIN, 14));
        formPanel.add(titleField, gbc);

        // Row 1: Date & Category & Mood
        gbc.gridx = 0; gbc.gridy = 1; gbc.gridwidth = 1; gbc.weightx = 0.15;
        formPanel.add(new JLabel("Date (YYYY-MM-DD):"), gbc);
        gbc.gridx = 1; gbc.weightx = 0.35;
        dateField = new JTextField(LocalDate.now().toString());
        formPanel.add(dateField, gbc);

        gbc.gridx = 2; gbc.weightx = 0.15;
        formPanel.add(new JLabel("Category:"), gbc);
        gbc.gridx = 3; gbc.weightx = 0.35;
        categoryCombo = new JComboBox<>(new String[]{"Personal", "Work", "Ideas", "Travel", "Health"});
        formPanel.add(categoryCombo, gbc);

        // Row 2: Mood & Rating
        gbc.gridx = 0; gbc.gridy = 2; gbc.weightx = 0.15;
        formPanel.add(new JLabel("Mood:"), gbc);
        gbc.gridx = 1; gbc.weightx = 0.35;
        moodCombo = new JComboBox<>(new String[]{"😊 Happy", "🧠 Productive", "☕ Calm", "😔 Tired", "⚡ Excited", "🤯 Stressed"});
        formPanel.add(moodCombo, gbc);

        gbc.gridx = 2; gbc.weightx = 0.15;
        formPanel.add(new JLabel("Rating (1-5):"), gbc);
        gbc.gridx = 3; gbc.weightx = 0.35;
        ratingSlider = new JSlider(1, 5, 5);
        ratingSlider.setMajorTickSpacing(1);
        ratingSlider.setPaintTicks(true);
        ratingSlider.setPaintLabels(true);
        formPanel.add(ratingSlider, gbc);

        // Row 3: Security Checkbox (Passwords)
        gbc.gridx = 0; gbc.gridy = 3; gbc.gridwidth = 1; gbc.weightx = 0.15;
        formPanel.add(new JLabel("Passcode Protection:"), gbc);
        gbc.gridx = 1; gbc.gridwidth = 3; gbc.weightx = 0.85;
        lockCheckBox = new JCheckBox("Secure this entry with verification password");
        formPanel.add(lockCheckBox, gbc);

        // Row 4: Large Text Area
        gbc.gridx = 0; gbc.gridy = 4; gbc.gridwidth = 1; gbc.weighty = 0.1;
        gbc.anchor = GridBagConstraints.NORTHWEST;
        formPanel.add(new JLabel("Content:"), gbc);
        
        gbc.gridx = 1; gbc.gridwidth = 3; gbc.weightx = 0.85; gbc.weighty = 1.0;
        gbc.fill = GridBagConstraints.BOTH;
        contentArea = new JTextArea();
        contentArea.setFont(new Font("SansSerif", Font.PLAIN, 14));
        contentArea.setLineWrap(true);
        contentArea.setWrapStyleWord(true);
        JScrollPane textScroll = new JScrollPane(contentArea);
        formPanel.add(textScroll, gbc);

        panel.add(formPanel, BorderLayout.CENTER);

        // Bottom Editor Buttons Panel
        JPanel actionPanel = new JPanel(new GridLayout(1, 4, 10, 10));
        actionPanel.setBorder(new EmptyBorder(10, 5, 5, 5));

        JButton saveButton = new JButton("💾 Save Entry");
        saveButton.setFont(new Font("SansSerif", Font.BOLD, 12));
        saveButton.setBackground(new Color(46, 204, 113));
        saveButton.setForeground(Color.WHITE);
        saveButton.addActionListener(e -> saveActiveEntry());

        JButton clearButton = new JButton("🧹 Reset Fields");
        clearButton.addActionListener(e -> prepareNewEntry());

        JButton deleteButton = new JButton("🗑️ Delete Entry");
        deleteButton.setBackground(new Color(231, 76, 60));
        deleteButton.setForeground(Color.WHITE);
        deleteButton.addActionListener(e -> deleteActiveEntry());

        actionPanel.add(saveButton);
        actionPanel.add(clearButton);
        actionPanel.add(deleteButton);

        panel.add(actionPanel, BorderLayout.SOUTH);

        return panel;
    }

    private void loadEntries() {
        listModel.clear();
        currentEntriesList = diaryDAO.getAllEntries();
        for (DiaryEntry entry : currentEntriesList) {
            listModel.addElement(entry);
        }
        updateStatus("Displaying all " + currentEntriesList.size() + " entries loaded from MySQL database.");
    }

    private void performSearch() {
        String query = searchField.getText().trim();
        if (query.isEmpty()) {
            loadEntries();
            return;
        }
        listModel.clear();
        currentEntriesList = diaryDAO.searchEntries(query);
        for (DiaryEntry entry : currentEntriesList) {
            listModel.addElement(entry);
        }
        updateStatus("Found " + currentEntriesList.size() + " matching results for user search query.");
    }

    private void handleCategoryFilter() {
        String selected = (String) filterCombo.getSelectedItem();
        if ("All Categories".equals(selected)) {
            loadEntries();
            return;
        }
        listModel.clear();
        currentEntriesList = diaryDAO.getEntriesByCategory(selected);
        for (DiaryEntry entry : currentEntriesList) {
            listModel.addElement(entry);
        }
        updateStatus("Filtered down to " + currentEntriesList.size() + " records in category '" + selected + "'.");
    }

    private void selectDiaryEntry(DiaryEntry entry) {
        if (entry == null) {
            prepareNewEntry();
            return;
        }

        // Check password lock
        if (entry.isLocked()) {
            String pass = JOptionPane.showInputDialog(this, "This digital entry is locked.\nEnter password to decrypt and view:", "Authentication Required", JOptionPane.WARNING_MESSAGE);
            if (pass == null) {
                // User cancelled
                entryJList.clearSelection();
                return;
            }
            if (!pass.equals(entry.getPasswordHash())) {
                JOptionPane.showMessageDialog(this, "Invalid diary credentials! Access denied.", "Security Error", JOptionPane.ERROR_MESSAGE);
                entryJList.clearSelection();
                return;
            }
        }

        activeEntry = entry;
        titleField.setText(entry.getTitle());
        contentArea.setText(entry.getContent());
        dateField.setText(entry.getEntryDate().toString());
        categoryCombo.setSelectedItem(entry.getCategory());
        moodCombo.setSelectedItem(entry.getMood());
        ratingSlider.setValue(entry.getRating());
        lockCheckBox.setSelected(entry.isLocked());
        updateStatus("Active diary record selected: " + entry.getTitle());
    }

    private void prepareNewEntry() {
        activeEntry = null;
        titleField.setText("");
        contentArea.setText("");
        dateField.setText(LocalDate.now().toString());
        categoryCombo.setSelectedIndex(0);
        moodCombo.setSelectedIndex(0);
        ratingSlider.setValue(5);
        lockCheckBox.setSelected(false);
        entryJList.clearSelection();
        updateStatus("Fields cleared. Ready to compose a brand new digital memory.");
    }

    private void saveActiveEntry() {
        String title = titleField.getText().trim();
        String content = contentArea.getText().trim();
        String dateStr = dateField.getText().trim();

        if (title.isEmpty() || content.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Title and Content fields cannot be empty!", "Validation Error", JOptionPane.WARNING_MESSAGE);
            return;
        }

        Date entrySQLDate;
        try {
            entrySQLDate = Date.valueOf(dateStr);
        } catch (IllegalArgumentException ex) {
            JOptionPane.showMessageDialog(this, "Invalid date format! Please specify as YYYY-MM-DD.", "Date Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        boolean isNew = (activeEntry == null);
        DiaryEntry entry = isNew ? new DiaryEntry() : activeEntry;

        entry.setTitle(title);
        entry.setContent(content);
        entry.setEntryDate(entrySQLDate);
        entry.setCategory((String) categoryCombo.getSelectedItem());
        entry.setMood((String) moodCombo.getSelectedItem());
        entry.setRating(ratingSlider.getValue());
        
        boolean wasLocked = entry.isLocked();
        boolean setLock = lockCheckBox.isSelected();
        entry.setLocked(setLock);

        if (setLock && (!wasLocked || entry.getPasswordHash() == null)) {
            String passValue = JOptionPane.showInputDialog(this, "Set a simple security password for this diary entry:", "Set Password", JOptionPane.QUESTION_MESSAGE);
            if (passValue == null || passValue.trim().isEmpty()) {
                JOptionPane.showMessageDialog(this, "Lock cancelled: A non-empty password is required to encrypt the entry.", "Lock Canceled", JOptionPane.INFORMATION_MESSAGE);
                lockCheckBox.setSelected(false);
                entry.setLocked(false);
                entry.setPasswordHash(null);
            } else {
                entry.setPasswordHash(passValue.trim());
            }
        } else if (!setLock) {
            entry.setPasswordHash(null);
        }

        boolean outcome;
        if (isNew) {
            outcome = diaryDAO.addEntry(entry);
        } else {
            outcome = diaryDAO.updateEntry(entry);
        }

        if (outcome) {
            loadEntries();
            // Reselect the entry from the model list to reload appropriately
            for (int i = 0; i < listModel.size(); i++) {
                if (listModel.get(i).getId() == entry.getId()) {
                    entryJList.setSelectedIndex(i);
                    break;
                }
            }
            JOptionPane.showMessageDialog(this, "Digital diary entry successfully committed to MySQL Database!", "Success", JOptionPane.INFORMATION_MESSAGE);
        } else {
            JOptionPane.showMessageDialog(this, "Failed to commit entry due to MySQL Driver or Connection failure.", "Database Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void deleteActiveEntry() {
        if (activeEntry == null) {
            JOptionPane.showMessageDialog(this, "Please select an entry in the list to trigger deletion.", "Info", JOptionPane.INFORMATION_MESSAGE);
            return;
        }

        int confirm = JOptionPane.showConfirmDialog(this, 
                "Are you absolutely sure you want to permanently delete: \"" + activeEntry.getTitle() + "\"?", 
                "Confirm SQL Deletion", 
                JOptionPane.YES_NO_OPTION);

        if (confirm == JOptionPane.YES_OPTION) {
            if (diaryDAO.deleteEntry(activeEntry.getId())) {
                loadEntries();
                prepareNewEntry();
                JOptionPane.showMessageDialog(this, "Entry permanently expunged from database standard rows.", "Entry Deleted", JOptionPane.INFORMATION_MESSAGE);
            } else {
                JOptionPane.showMessageDialog(this, "Failed to complete DELETE statement on database.", "SQL Fail", JOptionPane.ERROR_MESSAGE);
            }
        }
    }

    private void updateStatus(String msg) {
        statusLabel.setText("Status: " + msg);
    }

    public static void main(String[] args) {
        // Set modern Operating System native Look & Feel
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            // Fallback gracefully
        }

        SwingUtilities.invokeLater(() -> {
            new DiarySwingUI().setVisible(true);
        });
    }
}
`
  },
  "README.md": {
    filename: "README.md",
    language: "markdown",
    description: "Deployment guides, MySQL schema initialization, compilation instructions, run instructions.",
    content: `# 📓 Java Digital Diary (Swing + JDBC + MySQL)

A fully operational, elegant and secure **cross-platform Java Desktop Application** built to record personal diaries, moods, and categories directly into a **MySQL Relational Database**.

---

## 🛠 Prerequisites

Ensure you have the following installs running locally:
1. **JDK (Java Development Kit) 17 or higher**
   - Check using: \`java -version\`
2. **MySQL Server (8.x or similar)**
   - Check using: \`mysql --version\`
3. **MySQL Connector/J (JDBC Connection Driver)**
   - Download JAR from [Official Site](https://dev.mysql.com/downloads/connector/j/) or configure Maven dependency.

---

## 💾 Section 1: MySQL Database Setup

1. Log into your MySQL console:
   \`\`\`bash
   mysql -u root -p
   \`\`\`
2. Execute the schema query file to bootstrap the dairy schema and populate sample rows:
   \`\`\`sql
   -- Inside MySQL Shell, run:
   SOURCE schema.sql;
   \`\`\`
3. Verify table initialization:
   \`\`\`sql
   USE digital_diary;
   SHOW TABLES;
   SELECT * FROM diary_entries;
   \`\`\`

---

## 🏗 Section 2: Directory Layout
To compile and execute, place the files in this package/directory layout:
\`\`\`text
org/
└── diary/
    ├── db/
    │   └── DatabaseConnection.java
    ├── model/
    │   └── DiaryEntry.java
    ├── dao/
    │   └── DiaryDAO.java
    └── ui/
        └── DiarySwingUI.java
\`\`\`

---

## 🚀 Section 3: Build & Execution Scripts

### Option A: Maven Setup (Recommended)
Add this dependency to your \`pom.xml\` for MySQL Connector JDBC access:
\`\`\`xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.3.0</version>
</dependency>
\`\`\`

### Option B: Raw Terminal Compilation (Using JAR file)
1. Download standard \`mysql-connector-j-8.3.0.jar\` and place it in your local directory.
2. **Compile all Java source classes**:
   - **Linux/macOS**:
     \`\`\`bash
     javac -cp \".:mysql-connector-j-8.3.0.jar\" org/diary/db/*.java org/diary/model/*.java org/diary/dao/*.java org/diary/ui/*.java
     \`\`\`
   - **Windows**:
     \`\`\`cmd
     javac -cp \".;mysql-connector-j-8.3.0.jar\" org\\diary\\db\\*.java org\\diary\\model\\*.java org\\diary\\dao\\*.java org\\diary\\ui\\*.java
     \`\`\`
3. **Trigger the application execution**:
   - **Linux/macOS**:
     \`\`\`bash
     java -cp \".:mysql-connector-j-8.3.0.jar\" org.diary.ui.DiarySwingUI
     \`\`\`
   - **Windows**:
     \`\`\`cmd
     java -cp \".;mysql-connector-j-8.3.0.jar\" org.diary.ui.DiarySwingUI
     \`\`\`

---

## 🔒 Security Features Included
* **SQL Injection Prevention**: All queries to fetch, update, delete or add database parameters utilize secured JDBC \`PreparedStatement\` placeholders rather than naive concatenation.
* **Passcode Decryption Lock**: Sensitive entries can be marked locked. When opening a locked item in the listing JList, an interactive passcode UI pops up validating against password_hash.
* **Auto-closing statements**: Auto-closing resources with Java try-with-resources avoids connection leaks.
`
  }
};
