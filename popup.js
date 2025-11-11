let commentBanks = [];
let currentCommentBankIndex = -1; // Track which comment bank is currently open
let activeTagFilters = []; // Track which tags are being filtered
let selectedComments = new Set(); // Track which comments are checked
let searchQuery = ''; // Track search query

function goToHome() {
  document.getElementById('comment-container').style.display = 'none';
  document.getElementById('archive-container').style.display = 'none';
  document.getElementById('landing-container').style.display = 'block';
  document.querySelector('.container').style.display = 'block';

  // Update header
  document.getElementById('main-title').style.display = 'block';
  document.getElementById('assignment-heading').style.display = 'none';
  document.querySelector('.header-back-btn').style.display = 'none';
  document.querySelector('.logo-container').style.display = 'flex';

  // Clear the URL hash
  history.pushState(null, '', window.location.pathname);
  currentCommentBankIndex = -1;

  // Clear selections and hide deselect button
  selectedComments.clear();
  const deselectBtn = document.getElementById('deselect-all-btn');
  if (deselectBtn) {
    deselectBtn.style.display = 'none';
  }
}



function deleteCommentBanks() {
  // Show the delete popup with checkboxes for each comment bank
  const deleteCheckboxes = document.getElementById('delete-checkboxes');
  deleteCheckboxes.innerHTML = '';
  commentBanks.forEach((commentBank, index) => {
    // Skip the Sample Comment Bank - don't allow deletion
    if (commentBank.assignmentName === "Sample Comment Bank") {
      return;
    }
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `comment-bank-${index}`;
    checkbox.value = index;
    const label = document.createElement('label');
    label.htmlFor = `comment-bank-${index}`;
    label.textContent = commentBank.assignmentName;
    deleteCheckboxes.appendChild(checkbox);
    deleteCheckboxes.appendChild(label);
    deleteCheckboxes.appendChild(document.createElement('br'));
  });
  document.getElementById('delete-popup').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}

function deleteComment(index) {
  if (currentCommentBankIndex === -1) return;
  const currentCommentBank = commentBanks[currentCommentBankIndex];
  currentCommentBank.comments.splice(index, 1);

  // Update selectedComments: remove deleted index and shift down all higher indices
  const newSelectedComments = new Set();
  selectedComments.forEach(selectedIndex => {
    if (selectedIndex < index) {
      newSelectedComments.add(selectedIndex);
    } else if (selectedIndex > index) {
      newSelectedComments.add(selectedIndex - 1);
    }
    // If selectedIndex === index, don't add it (it's been deleted)
  });
  selectedComments = newSelectedComments;

  saveData();
  displayComments(currentCommentBank.comments);
}


function confirmDeleteCommentBanks() {
  // Show the confirmation popup for deleting selected comment banks
  document.getElementById('delete-popup').style.display = 'none';
  document.getElementById('confirm-delete-popup').style.display = 'block';
}

function deleteSelectedCommentBanks() {
  // Get the selected comment banks and delete them
  const selectedCommentBanks = Array.from(document.querySelectorAll('#delete-checkboxes input[type="checkbox"]:checked'))
    .map(checkbox => parseInt(checkbox.value));
  // Filter out selected banks, but never delete the Sample Comment Bank
  commentBanks = commentBanks.filter((bank, index) => {
    if (bank.assignmentName === "Sample Comment Bank") {
      return true; // Always keep Sample Comment Bank
    }
    return !selectedCommentBanks.includes(index);
  });
  saveData();
  updateCommentBankList();
  hideConfirmDeletePopup();
}

function showPopup() {
  document.getElementById('popup').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
  document.getElementById('assignment-name').focus();
}

function hidePopup() {
  document.getElementById('popup').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
}

function showClearDataPopup() {
  document.getElementById('clear-data-popup').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}

function hideClearDataPopup() {
  document.getElementById('clear-data-popup').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
}

function hideDeletePopup() {
  document.getElementById('delete-popup').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
}

function hideConfirmDeletePopup() {
  document.getElementById('confirm-delete-popup').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
}

function hideDownloadPopup() {
  document.getElementById('download-popup').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
}

function uploadCommentBank() {
  document.getElementById('upload-popup').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}

function hideUploadPopup() {
  document.getElementById('upload-popup').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('upload-input').value = '';
  document.getElementById('selected-files').innerHTML = '';
}

function displaySelectedFiles(files) {
  const selectedFilesContainer = document.getElementById('selected-files');
  selectedFilesContainer.innerHTML = '';

  if (files.length === 0) {
    return;
  }

  Array.from(files).forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'selected-file-item';

    const fileName = document.createElement('span');
    fileName.className = 'selected-file-name';
    fileName.textContent = file.name;

    fileItem.appendChild(fileName);
    selectedFilesContainer.appendChild(fileItem);
  });
}

// Global variable to track which drawer is being archived
let drawerToArchiveIndex = -1;

// Global variable to track which card is being duplicated
let cardToDuplicateIndex = -1;

function showDuplicateCardModal(cardIndex) {
  if (currentCommentBankIndex === -1) return;

  cardToDuplicateIndex = cardIndex;
  const card = commentBanks[currentCommentBankIndex].comments[cardIndex];

  // Set card title in modal
  document.getElementById('duplicate-card-title').textContent = `"${card.title || 'Untitled Card'}"`;

  // Populate drawer list
  const drawerList = document.getElementById('duplicate-drawer-list');
  drawerList.innerHTML = '';

  commentBanks.forEach((drawer, index) => {
    // Skip archived drawers and current drawer
    if (drawer.archived || index === currentCommentBankIndex) return;

    const drawerItem = document.createElement('div');
    drawerItem.className = 'duplicate-drawer-item';

    const drawerName = document.createElement('span');
    drawerName.className = 'duplicate-drawer-name';
    drawerName.textContent = drawer.assignmentName;

    const cardCount = document.createElement('span');
    cardCount.className = 'duplicate-drawer-count';
    cardCount.textContent = `${drawer.comments.length} cards`;

    drawerItem.appendChild(drawerName);
    drawerItem.appendChild(cardCount);

    drawerItem.addEventListener('click', () => {
      duplicateCardToDrawer(cardIndex, index);
    });

    drawerList.appendChild(drawerItem);
  });

  // Show modal
  document.getElementById('duplicate-card-popup').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}

function hideDuplicateCardModal() {
  document.getElementById('duplicate-card-popup').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
  cardToDuplicateIndex = -1;
}

function duplicateCardToDrawer(cardIndex, targetDrawerIndex) {
  if (currentCommentBankIndex === -1) return;

  const sourceCard = commentBanks[currentCommentBankIndex].comments[cardIndex];
  const targetDrawer = commentBanks[targetDrawerIndex];

  // Create a copy of the card
  const duplicatedCard = {
    title: sourceCard.title,
    link: sourceCard.link,
    description: sourceCard.description,
    tags: [] // Don't copy tags as they may not exist in target drawer
  };

  // Add to target drawer
  targetDrawer.comments.push(duplicatedCard);

  // Save and close
  saveData();
  hideDuplicateCardModal();

  // Show success feedback
  alert(`Card duplicated to "${targetDrawer.assignmentName}"!`);
}

function showArchiveConfirmPopup(index) {
  drawerToArchiveIndex = index;
  const drawerName = commentBanks[index].assignmentName;
  document.getElementById('archive-drawer-name').textContent = `"${drawerName}"`;
  document.getElementById('archive-confirm-popup').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}

function hideArchiveConfirmPopup() {
  document.getElementById('archive-confirm-popup').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
  drawerToArchiveIndex = -1;
}

function confirmArchiveDrawer() {
  if (drawerToArchiveIndex !== -1) {
    commentBanks[drawerToArchiveIndex].archived = true;
    saveData();
    updateCommentBankList();
    hideArchiveConfirmPopup();
  }
}

function confirmDeleteDrawer() {
  if (drawerToArchiveIndex !== -1) {
    const bankName = commentBanks[drawerToArchiveIndex].assignmentName;
    if (confirm(`Are you sure you want to permanently delete "${bankName}"? This cannot be undone and will delete all cards in this drawer.`)) {
      commentBanks.splice(drawerToArchiveIndex, 1);
      saveData();
      updateCommentBankList();
      hideArchiveConfirmPopup();
    }
  }
}

function openArchiveDrawer() {
  // Hide landing and comment containers
  document.getElementById('landing-container').style.display = 'none';
  document.getElementById('comment-container').style.display = 'none';
  document.getElementById('archive-container').style.display = 'block';
  document.querySelector('.container').style.display = 'block';

  // Update header
  document.getElementById('main-title').style.display = 'none';
  document.getElementById('assignment-heading').textContent = '📦 Archive';
  document.getElementById('assignment-heading').style.display = 'block';
  document.querySelector('.header-back-btn').style.display = 'block';
  document.querySelector('.logo-container').style.display = 'none';

  // Display archived drawers
  displayArchivedDrawers();
}

function displayArchivedDrawers() {
  const archivedList = document.getElementById('archived-drawers-list');
  archivedList.innerHTML = '';

  const archivedDrawers = commentBanks.filter(bank => bank.archived);

  if (archivedDrawers.length === 0) {
    archivedList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <h3>No archived drawers</h3>
        <p>Archived drawers will appear here</p>
      </div>
    `;
    return;
  }

  commentBanks.forEach((commentBank, index) => {
    if (!commentBank.archived) return;

    const drawerItem = document.createElement('div');
    drawerItem.className = 'archived-drawer-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'archived-drawer-name';
    nameSpan.textContent = commentBank.assignmentName;

    const cardCount = document.createElement('span');
    cardCount.className = 'archived-drawer-count';
    cardCount.textContent = `${commentBank.comments.length} card${commentBank.comments.length !== 1 ? 's' : ''}`;

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'archived-drawer-actions';

    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'archived-action-btn restore-btn';
    restoreBtn.textContent = '↻ Restore';
    restoreBtn.addEventListener('click', () => {
      restoreCommentBank(index);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'archived-action-btn delete-btn';
    deleteBtn.textContent = '🗑 Delete';
    deleteBtn.addEventListener('click', () => {
      deleteArchivedCommentBank(index);
    });

    actionsDiv.appendChild(restoreBtn);
    actionsDiv.appendChild(deleteBtn);

    drawerItem.appendChild(nameSpan);
    drawerItem.appendChild(cardCount);
    drawerItem.appendChild(actionsDiv);

    archivedList.appendChild(drawerItem);
  });
}

// Extract metadata description from a tab
async function extractTabMetadata(tabId, url) {
  try {
    // Skip chrome:// and other internal URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return '';
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // Try to get meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && metaDesc.content) {
          return metaDesc.content.trim();
        }

        // Try Open Graph description
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && ogDesc.content) {
          return ogDesc.content.trim();
        }

        // Fallback to first paragraph
        const firstPara = document.querySelector('p');
        if (firstPara && firstPara.textContent) {
          const text = firstPara.textContent.trim();
          // Limit to 300 characters
          return text.length > 300 ? text.substring(0, 297) + '...' : text;
        }

        return '';
      }
    });

    return results && results[0] && results[0].result ? results[0].result : '';
  } catch (error) {
    // If we can't inject (e.g., chrome store pages, pdf files), return empty
    console.log('Could not extract metadata from tab:', error);
    return '';
  }
}

async function handleEnterKey() {
  const assignmentName = document.getElementById('assignment-name').value.trim();

  // Check if name is empty
  if (!assignmentName) {
    alert('Please enter a drawer name.');
    return;
  }

  // Check for duplicate drawer name (case-insensitive, including archived)
  const duplicateExists = commentBanks.some(bank =>
    bank.assignmentName.toLowerCase() === assignmentName.toLowerCase()
  );

  if (duplicateExists) {
    alert(`A drawer named "${assignmentName}" already exists. Please choose a different name.`);
    return;
  }

  const gatherTabs = document.getElementById('gather-tabs-checkbox').checked;

  const newCommentBank = {
    assignmentName: assignmentName,
    comments: [],
    tags: [], // New user-created drawers start with no tags
    archived: false
  };
  commentBanks.push(newCommentBank);

  // If gather tabs is checked, collect all open tabs
  if (gatherTabs) {
    chrome.tabs.query({}, async (tabs) => {
      // Extract metadata from each tab
      const tabPromises = tabs.map(async (tab) => {
        const description = await extractTabMetadata(tab.id, tab.url);
        return {
          title: tab.title,
          link: tab.url,
          description: description,
          tags: []
        };
      });

      // Wait for all metadata extraction to complete
      const cards = await Promise.all(tabPromises);
      newCommentBank.comments = cards;

      saveData();
      updateCommentBankList();
      openCommentBank(commentBanks.length - 1);
    });
  } else {
    saveData();
    updateCommentBankList();
    openCommentBank(commentBanks.length - 1);
  }

  document.getElementById('assignment-name').value = '';
  document.getElementById('gather-tabs-checkbox').checked = false;
  document.getElementById('popup').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
}

// Generate unique IDs for tags
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function addComment() {
    // Clear the form
    document.getElementById('card-title').value = '';
    document.getElementById('card-link').value = '';
    document.getElementById('card-description').value = '';
    document.getElementById('add-comment-popup').removeAttribute('data-index');
    document.getElementById('comment-modal-title').textContent = 'New Card';

    // Populate tags
    populateModalTags();

    showAddCommentPopup();
}

function editComment(button, index) {
  if (currentCommentBankIndex === -1) return;
  const commentBank = commentBanks[currentCommentBankIndex];
  const comment = commentBank.comments[index];

  document.getElementById('card-title').value = comment.title || '';
  document.getElementById('card-link').value = comment.link || '';
  document.getElementById('card-description').value = comment.description || '';
  document.getElementById('add-comment-popup').setAttribute('data-index', index);
  document.getElementById('comment-modal-title').textContent = 'Edit Card';

  // Populate tags and select the comment's tags
  populateModalTags(comment.tags || []);

  showAddCommentPopup();
}

function copySelectedComments() {
  if (currentCommentBankIndex === -1) return;

  if (selectedComments.size === 0) {
    // Flash the button to show nothing to copy
    const copyBtn = document.getElementById('copySelectedBtn');
    const originalContent = copyBtn.textContent;
    copyBtn.textContent = '∅';
    setTimeout(() => {
      copyBtn.textContent = originalContent;
    }, 800);
    return;
  }

  const currentCommentBank = commentBanks[currentCommentBankIndex];
  const selectedTexts = Array.from(selectedComments)
    .map(index => {
      const card = currentCommentBank.comments[index];
      if (!card) return '';
      let text = card.title || '';
      if (card.link) text += `\n${card.link}`;
      if (card.description) text += `\n${card.description}`;
      return text;
    })
    .filter(text => text); // Filter out any undefined or empty

  if (selectedTexts.length > 0) {
    const commentsWithLineBreaks = selectedTexts.join('\n\n');
    navigator.clipboard.writeText(commentsWithLineBreaks).then(function() {
      // Visual feedback: show checkmark, then count
      const copyBtn = document.getElementById('copySelectedBtn');
      const originalContent = copyBtn.textContent;
      const count = selectedTexts.length;

      // Show checkmark
      copyBtn.textContent = '✓';

      // After 400ms, show the count
      setTimeout(() => {
        copyBtn.textContent = count.toString();
      }, 400);

      // After 1200ms total, restore original icon
      setTimeout(() => {
        copyBtn.textContent = originalContent;
      }, 1200);
    }, function(err) {
      console.error('Could not copy text: ', err);
      // Show error feedback
      const copyBtn = document.getElementById('copySelectedBtn');
      const originalContent = copyBtn.textContent;
      copyBtn.textContent = '✗';
      setTimeout(() => {
        copyBtn.textContent = originalContent;
      }, 800);
    });
  } else {
    alert('No cards selected!');
  }
}

function saveData() {
  chrome.storage.local.set({ commentBankData: commentBanks });
}

function getPreloadedCommentBanks() {
  // Common tags for bookmarking
  const commonTags = [
    { id: generateId(), name: 'Important', color: '#e74c3c' },
    { id: generateId(), name: 'To Read', color: '#3498db' },
    { id: generateId(), name: 'Reference', color: '#9b59b6' },
    { id: generateId(), name: 'Current Semester', color: '#2ecc71' },
    { id: generateId(), name: 'Archive', color: '#95a5a6' }
  ];

  return [
    {
      assignmentName: "Faculty Resources",
      archived: false,
      tags: [
        { id: generateId(), name: 'Department', color: '#6b2d8f' },
        { id: generateId(), name: 'Professional Development', color: '#3498db' },
        { id: generateId(), name: 'Policies', color: '#e74c3c' },
        { id: generateId(), name: 'Tools', color: '#2ecc71' },
        ...commonTags
      ],
      comments: [
        {
          title: "Department Portal",
          link: "https://example.com/department",
          description: "Access department resources, schedules, and announcements",
          tags: []
        },
        {
          title: "Professional Development Workshops",
          link: "https://example.com/workshops",
          description: "Upcoming faculty workshops on teaching methodologies and technology integration",
          tags: []
        }
      ]
    },
    {
      assignmentName: "Student Resources",
      archived: false,
      tags: [
        { id: generateId(), name: 'Academic Support', color: '#1abc9c' },
        { id: generateId(), name: 'Writing Center', color: '#3498db' },
        { id: generateId(), name: 'Tutoring', color: '#9b59b6' },
        { id: generateId(), name: 'Campus Services', color: '#e67e22' },
        ...commonTags
      ],
      comments: []
    },
    {
      assignmentName: "Major Assignments",
      archived: false,
      tags: [
        { id: generateId(), name: 'Research Paper', color: '#8e44ad' },
        { id: generateId(), name: 'Final Project', color: '#c0392b' },
        { id: generateId(), name: 'Presentation', color: '#2980b9' },
        { id: generateId(), name: 'Portfolio', color: '#16a085' },
        ...commonTags
      ],
      comments: []
    },
    {
      assignmentName: "Minor Assignments",
      archived: false,
      tags: [
        { id: generateId(), name: 'Discussion', color: '#27ae60' },
        { id: generateId(), name: 'Reflection', color: '#f39c12' },
        { id: generateId(), name: 'Response Paper', color: '#8e44ad' },
        { id: generateId(), name: 'Quiz', color: '#e74c3c' },
        ...commonTags
      ],
      comments: []
    },
    {
      assignmentName: "Handouts",
      archived: false,
      tags: [
        { id: generateId(), name: 'Style Guide', color: '#9b59b6' },
        { id: generateId(), name: 'Templates', color: '#3498db' },
        { id: generateId(), name: 'Examples', color: '#2ecc71' },
        { id: generateId(), name: 'Rubrics', color: '#e67e22' },
        ...commonTags
      ],
      comments: []
    },
    {
      assignmentName: "Class Activities",
      archived: false,
      tags: [
        { id: generateId(), name: 'Group Work', color: '#16a085' },
        { id: generateId(), name: 'Discussion Prompts', color: '#2980b9' },
        { id: generateId(), name: 'Exercises', color: '#f39c12' },
        { id: generateId(), name: 'Games', color: '#c0392b' },
        ...commonTags
      ],
      comments: []
    },
    {
      assignmentName: "Readings",
      archived: false,
      tags: [
        { id: generateId(), name: 'Required', color: '#c0392b' },
        { id: generateId(), name: 'Recommended', color: '#f39c12' },
        { id: generateId(), name: 'Supplemental', color: '#3498db' },
        { id: generateId(), name: 'Articles', color: '#9b59b6' },
        { id: generateId(), name: 'Books', color: '#16a085' },
        ...commonTags
      ],
      comments: []
    },
    {
      assignmentName: "Research",
      archived: false,
      tags: [
        { id: generateId(), name: 'Databases', color: '#8e44ad' },
        { id: generateId(), name: 'Journals', color: '#2980b9' },
        { id: generateId(), name: 'Citation Tools', color: '#16a085' },
        { id: generateId(), name: 'Primary Sources', color: '#c0392b' },
        { id: generateId(), name: 'Secondary Sources', color: '#f39c12' },
        ...commonTags
      ],
      comments: []
    }
  ];
}

function loadData() {
  chrome.storage.local.get(['commentBankData'], (result) => {
    const data = result.commentBankData;
    if (data) {
      commentBanks = data;
      // Ensure backwards compatibility - add tags to old comment banks
      commentBanks.forEach(bank => {
        if (!bank.tags) {
          bank.tags = []; // Old user-created drawers start with no tags
        }
        // Add archived property if it doesn't exist
        if (bank.archived === undefined) {
          bank.archived = false;
        }
        // Migrate old comments to new card structure
        if (bank.comments) {
          bank.comments.forEach(comment => {
            // Migrate old text-based comments to new card structure
            if (comment.text && !comment.title) {
              comment.title = comment.text.substring(0, 100); // Use first 100 chars as title
              comment.link = '';
              comment.description = comment.text.length > 100 ? comment.text.substring(100) : '';
              delete comment.text; // Remove old field
            }
            if (!comment.tags && comment.color) {
              comment.tags = [];
              // Don't auto-migrate colors to maintain data integrity
            }
            if (!comment.tags) {
              comment.tags = [];
            }
            // Ensure all card fields exist
            if (!comment.title) comment.title = '';
            if (!comment.link) comment.link = '';
            if (!comment.description) comment.description = '';
          });
        }
      });
    } else {
      // Initialize with empty array
      commentBanks = [];
    }

    // Always ensure preloaded comment banks exist
    const preloadedBanks = getPreloadedCommentBanks();

    preloadedBanks.forEach(preloadedBank => {
      const exists = commentBanks.some(bank => bank.assignmentName === preloadedBank.assignmentName);
      if (!exists) {
        commentBanks.unshift(preloadedBank);
      }
    });

    saveData(); // Save any changes
    updateCommentBankList();

    // Check if there's a hash in the URL and open the corresponding bank
    loadCommentBankFromURL();
  });
}

// Load comment bank based on URL hash
function loadCommentBankFromURL() {
  const hash = window.location.hash.substring(1); // Remove the '#'
  if (hash) {
    // Find the comment bank with matching slug
    const index = commentBanks.findIndex(bank => slugify(bank.assignmentName) === hash);
    if (index !== -1) {
      // Don't update history when loading from URL on page load
      openCommentBank(index, false);
    }
  }
}

// Wait for DOM to be ready before setting up event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Assignment name input
  document.getElementById('assignment-name').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleEnterKey();
    }
  });

  // Options dropdown
  document.getElementById('optionsDropdownBtn').addEventListener('click', toggleOptionsDropdown);
  document.getElementById('aboutBtn').addEventListener('click', showAbout);
  document.getElementById('uploadBtn').addEventListener('click', function() {
    toggleOptionsDropdown();
    uploadCommentBank();
  });
  document.getElementById('downloadBtn').addEventListener('click', function() {
    toggleOptionsDropdown();
    downloadCommentBank();
  });
  document.getElementById('deleteBtn').addEventListener('click', function() {
    toggleOptionsDropdown();
    deleteCommentBanks();
  });
  document.getElementById('resetBtn').addEventListener('click', function() {
    toggleOptionsDropdown();
    showClearDataPopup();
  });

  // Overlay
  document.getElementById('overlay').addEventListener('click', hideAllPopups);

  // Add comment bank button
  document.getElementById('addCommentBankBtn').addEventListener('click', showPopup);

  // Assignment creation buttons
  document.getElementById('createBankBtn').addEventListener('click', handleEnterKey);
  document.getElementById('cancelBankBtn').addEventListener('click', hidePopup);

  // Delete popup buttons
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteCommentBanks);
  document.getElementById('cancelDeleteBtn').addEventListener('click', hideDeletePopup);
  document.getElementById('yesDeleteBtn').addEventListener('click', deleteSelectedCommentBanks);
  document.getElementById('noDeleteBtn').addEventListener('click', hideConfirmDeletePopup);

  // Download popup buttons
  document.getElementById('downloadConfirmBtn').addEventListener('click', downloadSelectedCommentBank);
  document.getElementById('cancelDownloadBtn').addEventListener('click', hideDownloadPopup);

  // Upload popup buttons
  document.getElementById('uploadConfirmBtn').addEventListener('click', uploadSelectedCommentBank);
  document.getElementById('cancelUploadBtn').addEventListener('click', hideUploadPopup);

  // Archive confirmation popup buttons
  document.getElementById('confirmArchiveBtn').addEventListener('click', confirmArchiveDrawer);
  document.getElementById('confirmDeleteFromArchiveBtn').addEventListener('click', confirmDeleteDrawer);
  document.getElementById('cancelArchiveBtn').addEventListener('click', hideArchiveConfirmPopup);

  // About popup buttons
  document.getElementById('closeAboutBtn').addEventListener('click', hideAboutPopup);

  // Duplicate card popup buttons
  document.getElementById('cancelDuplicateBtn').addEventListener('click', hideDuplicateCardModal);

  // Clear data popup buttons
  document.getElementById('yesClearBtn').addEventListener('click', clearData);
  document.getElementById('noClearBtn').addEventListener('click', hideClearDataPopup);

  // Tag manager buttons
  document.getElementById('addTagBtn').addEventListener('click', addNewTag);
  document.getElementById('doneTagsBtn').addEventListener('click', hideTagManager);

  // Add comment popup buttons
  document.getElementById('saveCommentBtn').addEventListener('click', saveComment);
  document.getElementById('cancelCommentBtn').addEventListener('click', hideAddCommentPopup);

  // Comment bank view buttons (back button is now in header, attached earlier)
  document.getElementById('manageTagsBtn').addEventListener('click', showTagManager);
  document.getElementById('copySelectedBtn').addEventListener('click', copySelectedComments);
  document.getElementById('addCommentBtn').addEventListener('click', addComment);
  document.getElementById('clear-filters-btn').addEventListener('click', clearTagFilters);
  document.getElementById('deselect-all-btn').addEventListener('click', deselectAllComments);
  document.getElementById('toggle-filters-btn').addEventListener('click', toggleFilterBar);

  // Back button in header
  document.getElementById('backToHomeBtn').addEventListener('click', goToHome);

  // Search input for cards within drawer
  document.getElementById('comment-search').addEventListener('input', function(e) {
    searchQuery = e.target.value.toLowerCase().trim();
    if (currentCommentBankIndex !== -1) {
      displayComments(commentBanks[currentCommentBankIndex].comments);
    }

    // Show/hide clear button
    const clearBtn = document.getElementById('comment-search-clear');
    clearBtn.style.display = e.target.value ? 'flex' : 'none';
  });

  // Clear button for comment search
  document.getElementById('comment-search-clear').addEventListener('click', function() {
    const searchInput = document.getElementById('comment-search');
    searchInput.value = '';
    searchQuery = '';
    if (currentCommentBankIndex !== -1) {
      displayComments(commentBanks[currentCommentBankIndex].comments);
    }
    this.style.display = 'none';
    searchInput.focus();
  });

  // Search input for drawers
  document.getElementById('drawer-search').addEventListener('input', function(e) {
    const drawerSearchQuery = e.target.value.toLowerCase().trim();
    filterDrawers(drawerSearchQuery);

    // Show/hide clear button
    const clearBtn = document.getElementById('drawer-search-clear');
    clearBtn.style.display = e.target.value ? 'flex' : 'none';
  });

  // Clear button for drawer search
  document.getElementById('drawer-search-clear').addEventListener('click', function() {
    const searchInput = document.getElementById('drawer-search');
    searchInput.value = '';
    filterDrawers('');
    this.style.display = 'none';
    searchInput.focus();
  });

  // File upload input change handler
  document.getElementById('upload-input').addEventListener('change', function(e) {
    displaySelectedFiles(e.target.files);
  });
});

function filterDrawers(query) {
  const drawerLinks = document.querySelectorAll('.comment-bank-link:not(.archive-drawer-special)');
  let visibleCount = 0;

  drawerLinks.forEach((link) => {
    const nameSpan = link.querySelector('.comment-bank-name');
    if (nameSpan) {
      const drawerName = nameSpan.textContent.toLowerCase();
      const drawerIndex = parseInt(link.getAttribute('data-drawer-index'));
      const drawer = commentBanks[drawerIndex];

      // Safety check: skip if drawer doesn't exist
      if (!drawer) {
        return;
      }

      // Check if drawer name matches
      const drawerNameMatches = drawerName.includes(query);

      // Check if any cards in this drawer match
      // IMPORTANT: Only filter by card CONTENT, not drawer name
      const matchingCards = [];
      if (drawer.comments && drawer.comments.length > 0) {
        // Use a regular for loop to avoid any potential closure issues
        for (let i = 0; i < drawer.comments.length; i++) {
          const card = drawer.comments[i];
          // Only search in card content (title, description, link)
          const cardTitle = (card.title || '').toLowerCase();
          const cardDescription = (card.description || '').toLowerCase();
          const cardLink = (card.link || '').toLowerCase();

          // Check if query appears in any of these fields
          if (cardTitle.includes(query) || cardDescription.includes(query) || cardLink.includes(query)) {
            matchingCards.push(card);
          }
        }
      }

      // Show drawer if name matches OR if it has matching cards
      if (query === '' || drawerNameMatches || matchingCards.length > 0) {
        link.style.display = 'flex';
        visibleCount++;

        // Remove any existing search results display
        const existingResults = link.querySelector('.drawer-search-results');
        if (existingResults) {
          existingResults.remove();
        }

        // If there are matching cards (and query is not empty), show them
        if (query !== '' && matchingCards.length > 0) {
          const resultsDiv = document.createElement('div');
          resultsDiv.className = 'drawer-search-results';
          resultsDiv.innerHTML = `<span class="search-result-count">${matchingCards.length} matching card${matchingCards.length !== 1 ? 's' : ''}</span>`;

          // Add preview of matching cards
          const previewDiv = document.createElement('div');
          previewDiv.className = 'search-results-preview';
          matchingCards.slice(0, 3).forEach(card => {
            const cardPreview = document.createElement('div');
            cardPreview.className = 'search-result-card-preview';
            cardPreview.textContent = card.title || 'Untitled';
            cardPreview.style.cursor = 'pointer';

            // Find the original index of this card in the drawer
            const cardIndex = drawer.comments.findIndex(c => c === card);

            // Add click handler to open drawer and scroll to this card
            cardPreview.addEventListener('click', (e) => {
              e.stopPropagation(); // Prevent opening the drawer normally
              if (cardIndex !== -1) {
                openCommentBankAndScrollToCard(drawerIndex, cardIndex);
              }
            });

            previewDiv.appendChild(cardPreview);
          });
          resultsDiv.appendChild(previewDiv);

          link.appendChild(resultsDiv);
        }
      } else {
        link.style.display = 'none';

        // Remove any existing search results display
        const existingResults = link.querySelector('.drawer-search-results');
        if (existingResults) {
          existingResults.remove();
        }
      }
    }
  });

  // Search archived drawers if query is not empty
  // First, always remove any existing archived search results to start fresh
  const existingArchivedContainer = document.getElementById('archived-search-results');
  if (existingArchivedContainer) {
    existingArchivedContainer.remove();
  }

  if (query !== '') {
    let archivedMatches = [];

    // Iterate through ALL drawers with their original indices
    commentBanks.forEach((drawer, drawerIndex) => {
      // Only process archived drawers
      if (!drawer.archived) return;

      const drawerName = drawer.assignmentName.toLowerCase();
      const drawerNameMatches = drawerName.includes(query);

      // Check if any cards in THIS SPECIFIC drawer match the search
      // IMPORTANT: Only filter by card CONTENT, not drawer name
      const matchingCards = [];
      if (drawer.comments && drawer.comments.length > 0) {
        // Use a regular for loop to avoid any potential closure issues
        for (let i = 0; i < drawer.comments.length; i++) {
          const card = drawer.comments[i];
          // Only search in card content (title, description, link)
          const cardTitle = (card.title || '').toLowerCase();
          const cardDescription = (card.description || '').toLowerCase();
          const cardLink = (card.link || '').toLowerCase();

          // Check if query appears in any of these fields
          if (cardTitle.includes(query) || cardDescription.includes(query) || cardLink.includes(query)) {
            matchingCards.push(card);
          }
        }
      }

      // Show drawer if: drawer name matches OR cards match
      if (drawerNameMatches || matchingCards.length > 0) {
        archivedMatches.push({
          drawer,
          drawerIndex,
          matchingCards: matchingCards, // Only cards with matching content
          drawerNameMatches: drawerNameMatches // Track if drawer name matched
        });
      }
    });

    // Display archived matches
    if (archivedMatches.length > 0) {
      const archivedSearchContainer = document.createElement('div');
      archivedSearchContainer.id = 'archived-search-results';
      archivedSearchContainer.className = 'archived-search-results';

      const header = document.createElement('div');
      header.className = 'archived-search-header';
      header.textContent = '📦 Archived Drawers';
      archivedSearchContainer.appendChild(header);

      archivedMatches.forEach(({ drawer, drawerIndex, matchingCards }) => {
        const archivedLink = document.createElement('div');
        archivedLink.className = 'comment-bank-link archived-result';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'comment-bank-header';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'comment-bank-name';
        nameSpan.textContent = drawer.assignmentName;

        const archivedBadge = document.createElement('span');
        archivedBadge.className = 'archived-badge';
        archivedBadge.textContent = 'Archived';

        headerDiv.appendChild(nameSpan);
        headerDiv.appendChild(archivedBadge);
        archivedLink.appendChild(headerDiv);

        // Show matching cards ONLY if this drawer has cards whose CONTENT matches
        // (Not just if the drawer name matches)
        if (matchingCards && matchingCards.length > 0) {
          const resultsDiv = document.createElement('div');
          resultsDiv.className = 'drawer-search-results';
          resultsDiv.innerHTML = `<span class="search-result-count">${matchingCards.length} matching card${matchingCards.length !== 1 ? 's' : ''}</span>`;

          const previewDiv = document.createElement('div');
          previewDiv.className = 'search-results-preview';

          // Show up to 3 matching cards
          matchingCards.slice(0, 3).forEach(matchingCard => {
            const cardPreview = document.createElement('div');
            cardPreview.className = 'search-result-card-preview';
            cardPreview.textContent = matchingCard.title || 'Untitled';
            cardPreview.style.cursor = 'pointer';

            // Find THIS card's index in THIS drawer's comments array
            const cardIndex = drawer.comments.findIndex(c => c === matchingCard);

            // Click handler to restore and open
            cardPreview.addEventListener('click', (e) => {
              e.stopPropagation();
              if (cardIndex !== -1) {
                restoreAndOpenDrawer(drawerIndex, cardIndex);
              }
            });

            previewDiv.appendChild(cardPreview);
          });
          resultsDiv.appendChild(previewDiv);
          archivedLink.appendChild(resultsDiv);
        }

        // Click on drawer name to restore and open (without scrolling to a specific card)
        nameSpan.style.cursor = 'pointer';
        nameSpan.addEventListener('click', () => {
          restoreAndOpenDrawer(drawerIndex, null);
        });

        archivedSearchContainer.appendChild(archivedLink);
      });

      const commentBankList = document.getElementById('comment-bank-list');
      commentBankList.appendChild(archivedSearchContainer);

      visibleCount += archivedMatches.length;
    }
  }

  // Always show the Archive drawer
  const archiveDrawer = document.querySelector('.archive-drawer-special');
  if (archiveDrawer) {
    archiveDrawer.style.display = 'flex';
  }

  // Show/hide "no drawers" message based on visible count
  const noCommentBanksMessage = document.getElementById('no-comment-banks-message');
  if (visibleCount === 0 && commentBanks.length > 0) {
    noCommentBanksMessage.textContent = 'No cards or drawers match your search.';
    noCommentBanksMessage.style.display = 'block';
  } else if (commentBanks.length === 0) {
    noCommentBanksMessage.textContent = 'No drawers created yet.';
    noCommentBanksMessage.style.display = 'block';
  } else {
    noCommentBanksMessage.style.display = 'none';
  }
}

function updateCommentBankList() {
  const commentBankList = document.getElementById('comment-bank-list');
  const noCommentBanksMessage = document.getElementById('no-comment-banks-message');
  commentBankList.innerHTML = `
    <div class="add-comment-bank">
      <button class="add-button" id="addCommentBankBtn">+ Add Drawer</button>
    </div>
  `;

  // Re-attach event listener for the add button
  document.getElementById('addCommentBankBtn').addEventListener('click', showPopup);

  // Filter out archived drawers
  const activeDrawers = commentBanks.filter(bank => !bank.archived);

  if (activeDrawers.length === 0) {
    noCommentBanksMessage.style.display = 'block';
  } else {
    noCommentBanksMessage.style.display = 'none';
    commentBanks.forEach((commentBank, index) => {
      // Skip archived drawers
      if (commentBank.archived) return;

      const commentBankLink = document.createElement('div');
      commentBankLink.className = 'comment-bank-link';
      commentBankLink.setAttribute('data-drawer-index', index); // Store the actual index

      // Bank name and count container
      const nameContainer = document.createElement('div');
      nameContainer.className = 'comment-bank-name-container';
      nameContainer.addEventListener('click', () => openCommentBank(index));

      const nameSpan = document.createElement('span');
      nameSpan.className = 'comment-bank-name';
      nameSpan.textContent = commentBank.assignmentName;

      // Card count
      const cardCount = document.createElement('span');
      cardCount.className = 'drawer-card-count';
      cardCount.textContent = `${commentBank.comments.length}`;
      cardCount.title = `${commentBank.comments.length} card${commentBank.comments.length !== 1 ? 's' : ''}`;

      nameContainer.appendChild(nameSpan);
      nameContainer.appendChild(cardCount);

      // Actions container
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'comment-bank-actions';

      // Reorder buttons
      const reorderDiv = document.createElement('div');
      reorderDiv.className = 'bank-reorder-btns';

      const upBtn = document.createElement('button');
      upBtn.className = 'bank-reorder-btn';
      upBtn.textContent = '↑';
      upBtn.title = 'Move up';
      upBtn.disabled = index === 0;
      upBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveCommentBank(index, -1);
      });

      const downBtn = document.createElement('button');
      downBtn.className = 'bank-reorder-btn';
      downBtn.textContent = '↓';
      downBtn.title = 'Move down';
      downBtn.disabled = index === commentBanks.length - 1;
      downBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveCommentBank(index, 1);
      });

      reorderDiv.appendChild(upBtn);
      reorderDiv.appendChild(downBtn);

      // Archive button
      const archiveBtn = document.createElement('button');
      archiveBtn.className = 'bank-action-btn bank-archive-btn';
      archiveBtn.textContent = '📦';
      archiveBtn.title = 'Archive';
      archiveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        archiveCommentBank(index);
      });

      actionsDiv.appendChild(reorderDiv);
      actionsDiv.appendChild(archiveBtn);

      // Create a header div to wrap name and actions
      const headerDiv = document.createElement('div');
      headerDiv.className = 'comment-bank-header';
      headerDiv.appendChild(nameContainer);
      headerDiv.appendChild(actionsDiv);

      commentBankLink.appendChild(headerDiv);
      commentBankList.appendChild(commentBankLink);
    });
  }

  // Always add Archive drawer at the end
  const archivedCount = commentBanks.filter(bank => bank.archived).length;
  const archiveDrawer = document.createElement('div');
  archiveDrawer.className = 'comment-bank-link archive-drawer-special';

  const archiveHeader = document.createElement('div');
  archiveHeader.className = 'comment-bank-header';

  const archiveName = document.createElement('span');
  archiveName.className = 'comment-bank-name';
  archiveName.textContent = '📦 Archive';
  archiveName.addEventListener('click', () => openArchiveDrawer());

  const archiveCount = document.createElement('span');
  archiveCount.className = 'archive-count-badge';
  archiveCount.textContent = archivedCount.toString();
  archiveCount.style.display = archivedCount > 0 ? 'inline-block' : 'none';

  archiveHeader.appendChild(archiveName);
  archiveHeader.appendChild(archiveCount);
  archiveDrawer.appendChild(archiveHeader);
  commentBankList.appendChild(archiveDrawer);
}

function moveCommentBank(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= commentBanks.length) return;

  // Swap the banks
  [commentBanks[index], commentBanks[newIndex]] = [commentBanks[newIndex], commentBanks[index]];

  saveData();
  updateCommentBankList();
}

function archiveCommentBank(index) {
  showArchiveConfirmPopup(index);
}

function restoreCommentBank(index) {
  const bankName = commentBanks[index].assignmentName;
  if (confirm(`Restore "${bankName}" to your main drawers?`)) {
    commentBanks[index].archived = false;
    saveData();
    displayArchivedDrawers();
    updateCommentBankList();
  }
}

function restoreAndOpenDrawer(drawerIndex, cardIndex = null) {
  // Safety check: ensure drawer exists
  if (!commentBanks[drawerIndex]) {
    console.error('Invalid drawer index:', drawerIndex);
    return;
  }

  const drawer = commentBanks[drawerIndex];
  const bankName = drawer.assignmentName;

  // Safety check: ensure card index is valid if provided
  const cardName = cardIndex !== null && drawer.comments && drawer.comments[cardIndex]
    ? drawer.comments[cardIndex].title || 'Untitled'
    : null;

  const message = cardName
    ? `The card "${cardName}" is in the archived drawer "${bankName}".\n\nRestore this drawer to view it?`
    : `Restore archived drawer "${bankName}"?`;

  if (confirm(message)) {
    drawer.archived = false;
    saveData();
    updateCommentBankList();

    // Wait a bit for the drawer list to update, then open the drawer
    setTimeout(() => {
      if (cardIndex !== null && cardIndex >= 0 && drawer.comments && drawer.comments[cardIndex]) {
        openCommentBankAndScrollToCard(drawerIndex, cardIndex);
      } else {
        openCommentBank(drawerIndex);
      }
    }, 100);
  }
}

function deleteArchivedCommentBank(index) {
  const bankName = commentBanks[index].assignmentName;
  if (confirm(`Are you sure you want to permanently delete "${bankName}"? This cannot be undone and will delete all cards in this drawer.`)) {
    commentBanks.splice(index, 1);
    saveData();
    displayArchivedDrawers();
    updateCommentBankList();
  }
}

// Convert comment bank name to URL-friendly slug
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/--+/g, '-')      // Replace multiple hyphens with single hyphen
    .trim();
}

function openCommentBank(index, updateHistory = true) {
  currentCommentBankIndex = index; // Set the current comment bank
  activeTagFilters = []; // Reset filters when opening a comment bank
  selectedComments.clear(); // Clear selected comments when switching banks
  searchQuery = ''; // Reset search when opening a comment bank
  const commentBank = commentBanks[index];

  // Update header
  document.getElementById('main-title').style.display = 'none';
  document.getElementById('assignment-heading').textContent = commentBank.assignmentName;
  document.getElementById('assignment-heading').style.display = 'block';
  document.querySelector('.header-back-btn').style.display = 'block';
  document.querySelector('.logo-container').style.display = 'none';

  // Clear search input
  document.getElementById('comment-search').value = '';

  displayTagFilterBar();
  displayComments(commentBank.comments);

  // Collapse the tag filter bar by default
  const filtersContainer = document.getElementById('tag-filters');
  const toggleBtn = document.getElementById('toggle-filters-btn');
  filtersContainer.classList.add('hidden');
  toggleBtn.classList.add('collapsed');
  toggleBtn.textContent = '▶';

  document.getElementById('landing-container').style.display = 'none';
  document.querySelector('.container').style.display = 'none';
  document.getElementById('comment-container').style.display = 'block';
  window.scrollTo(0, 0); // Scroll to top to show comment bank immediately below header

  // Update URL with comment bank name (only if updateHistory is true)
  if (updateHistory) {
    const slug = slugify(commentBank.assignmentName);
    history.pushState({ commentBankIndex: index }, '', '#' + slug);
  }
}

function openCommentBankAndScrollToCard(drawerIndex, cardIndex) {
  // Open the drawer first
  openCommentBank(drawerIndex, true);

  // Wait for the DOM to update, then scroll to the card
  setTimeout(() => {
    const cardElement = document.querySelector(`[data-card-index="${cardIndex}"]`);
    if (cardElement) {
      // Scroll to the card with smooth behavior
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add a temporary highlight effect
      cardElement.style.transition = 'box-shadow 0.3s ease';
      cardElement.style.boxShadow = '0 0 0 3px rgba(107, 45, 143, 0.5)';

      // Remove the highlight after 2 seconds
      setTimeout(() => {
        cardElement.style.boxShadow = '';
      }, 2000);
    }
  }, 100);
}

// Display Tag Filter Bar
function displayTagFilterBar() {
  if (currentCommentBankIndex === -1) return;
  const commentBank = commentBanks[currentCommentBankIndex];
  const tagFiltersContainer = document.getElementById('tag-filters');

  if (!commentBank.tags) {
    commentBank.tags = [];
  }

  if (commentBank.tags.length === 0) {
    tagFiltersContainer.innerHTML = '<span style="color: var(--text-tertiary); font-size: 0.85rem;">No tags available</span>';
    return;
  }

  tagFiltersContainer.innerHTML = commentBank.tags.map(tag => `
    <span class="tag-filter"
          data-tag-id="${tag.id}"
          style="background-color: ${tag.color}20; color: ${tag.color}; border-color: ${tag.color};">
      ${tag.name}
    </span>
  `).join('');

  // Add event listeners to tag filters
  tagFiltersContainer.querySelectorAll('.tag-filter').forEach(filterEl => {
    filterEl.addEventListener('click', function() {
      toggleTagFilter(this.getAttribute('data-tag-id'));
    });
  });

  updateFilterCount();
}

// Toggle Tag Filter
function toggleTagFilter(tagId) {
  const index = activeTagFilters.indexOf(tagId);
  if (index > -1) {
    activeTagFilters.splice(index, 1);
  } else {
    activeTagFilters.push(tagId);
  }

  // Update visual state
  const filterElement = document.querySelector(`.tag-filter[data-tag-id="${tagId}"]`);
  if (filterElement) {
    filterElement.classList.toggle('active');
  }

  // Show/hide clear button
  const clearBtn = document.getElementById('clear-filters-btn');
  clearBtn.style.display = activeTagFilters.length > 0 ? 'block' : 'none';

  updateFilterCount();
  displayComments(commentBanks[currentCommentBankIndex].comments);

  // Scroll to top of the comments list
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Clear All Filters
function clearTagFilters() {
  activeTagFilters = [];

  // Remove active class from all filters
  document.querySelectorAll('.tag-filter.active').forEach(el => {
    el.classList.remove('active');
  });

  // Hide clear button
  document.getElementById('clear-filters-btn').style.display = 'none';

  updateFilterCount();
  displayComments(commentBanks[currentCommentBankIndex].comments);

  // Scroll to top of the comments list
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Deselect All Comments
function deselectAllComments() {
  selectedComments.clear();

  // Uncheck all checkboxes
  document.querySelectorAll('.comment-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });

  updateDeselectAllButton();
}

// Update Deselect All Button Visibility
function updateDeselectAllButton() {
  const deselectBtn = document.getElementById('deselect-all-btn');
  if (deselectBtn) {
    deselectBtn.style.display = selectedComments.size > 0 ? 'block' : 'none';
  }
}

// Toggle Filter Bar Visibility
function toggleFilterBar() {
  const toggleBtn = document.getElementById('toggle-filters-btn');
  const filtersContainer = document.getElementById('tag-filters');

  filtersContainer.classList.toggle('hidden');
  toggleBtn.classList.toggle('collapsed');

  // Update button text
  if (filtersContainer.classList.contains('hidden')) {
    toggleBtn.textContent = '▶';
  } else {
    toggleBtn.textContent = '▼';
  }
}

// Update Filter Count Display
function updateFilterCount() {
  if (currentCommentBankIndex === -1) return;
  const commentBank = commentBanks[currentCommentBankIndex];
  const filterCountEl = document.getElementById('filter-count');

  if (activeTagFilters.length === 0) {
    filterCountEl.textContent = `${commentBank.comments.length} cards`;
  } else {
    const filteredCount = commentBank.comments.filter(comment => {
      return comment.tags && comment.tags.some(tagId => activeTagFilters.includes(tagId));
    }).length;
    filterCountEl.textContent = `${filteredCount}/${commentBank.comments.length}`;
  }
}

function displayComments(comments) {
  if (currentCommentBankIndex === -1) return;
  const commentBank = commentBanks[currentCommentBankIndex];
  const commentsList = document.getElementById('comments-list');
  commentsList.innerHTML = '';

  // Ensure tags exist
  if (!commentBank.tags) {
    commentBank.tags = [];
  }

  // Show empty state if no comments
  if (comments.length === 0) {
    commentsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>No cards yet</h3>
        <p>Click the "+ Add Card" button above to create your first card</p>
      </div>
    `;
    return;
  }

  // Sort comments: matching search and filters first
  let sortedComments = comments.map((comment, originalIndex) => ({ comment, originalIndex }));

  if (activeTagFilters.length > 0 || searchQuery) {
    sortedComments = sortedComments.sort((a, b) => {
      const aHasTag = activeTagFilters.length === 0 || (a.comment.tags && a.comment.tags.some(tagId => activeTagFilters.includes(tagId)));
      const bHasTag = activeTagFilters.length === 0 || (b.comment.tags && b.comment.tags.some(tagId => activeTagFilters.includes(tagId)));
      const aSearchText = `${a.comment.title || ''} ${a.comment.description || ''} ${a.comment.link || ''}`.toLowerCase();
      const bSearchText = `${b.comment.title || ''} ${b.comment.description || ''} ${b.comment.link || ''}`.toLowerCase();
      const aMatchesSearch = !searchQuery || aSearchText.includes(searchQuery);
      const bMatchesSearch = !searchQuery || bSearchText.includes(searchQuery);

      // Prioritize comments that match both search and tags
      const aMatches = aHasTag && aMatchesSearch;
      const bMatches = bHasTag && bMatchesSearch;

      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }

  sortedComments.forEach(({ comment, originalIndex: index }) => {
    // Check if comment matches any active filters and search
    const matchesTagFilter = activeTagFilters.length === 0 ||
      (comment.tags && comment.tags.some(tagId => activeTagFilters.includes(tagId)));
    const searchableText = `${comment.title || ''} ${comment.description || ''} ${comment.link || ''}`.toLowerCase();
    const matchesSearch = !searchQuery || searchableText.includes(searchQuery);
    const matchesBoth = matchesTagFilter && matchesSearch;

    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.setAttribute('data-card-index', index);

    // Add visual feedback for filtered/non-matching state
    if ((activeTagFilters.length > 0 || searchQuery) && !matchesBoth) {
      commentElement.style.opacity = '0.4';
      commentElement.style.pointerEvents = 'auto'; // Keep clickable
    }

    // Ensure comment has tags array
    if (!comment.tags) {
      comment.tags = [];
    }

    // Get comment's tags
    const commentTags = comment.tags.map(tagId => {
      return commentBank.tags.find(t => t.id === tagId);
    }).filter(t => t); // Remove undefined tags

    // Set accent color (use first tag color or default)
    const accentColor = commentTags.length > 0 ? commentTags[0].color : '#888';
    commentElement.style.setProperty('--comment-accent-color', accentColor);

    // Build tags HTML
    const tagsHTML = commentTags.length > 0
      ? commentTags.map(tag => `
          <span class="tag" style="background-color: ${tag.color}20; color: ${tag.color}; border-color: ${tag.color};">
            ${tag.name}
          </span>
        `).join('')
      : '<span class="tag" style="background-color: #f5f5f5; color: #999; border-color: #ddd;">No tags</span>';

    // Highlight search terms in card fields
    const highlightText = (text) => {
      if (!text) return '';
      if (!searchQuery) return text;
      const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<span class="search-highlight">$1</span>');
    };

    const displayTitle = highlightText(comment.title || 'Untitled Card');
    const displayLink = comment.link || '';
    const displayDescription = highlightText(comment.description || '');

    // Make title clickable if there's a link
    const titleHTML = displayLink
      ? `<a href="${displayLink}" target="_blank" rel="noopener noreferrer" class="card-title-link">${displayTitle}</a>`
      : displayTitle;

    // Add copy link button if there's a link
    const copyLinkButton = displayLink
      ? `<button class="copy-link-btn" data-index="${index}" data-link="${displayLink}" title="Copy link">🔗</button>`
      : '';

    // Build description HTML with expand/collapse functionality
    const descriptionHTML = displayDescription ? `
      <div class="card-description-wrapper">
        <div class="card-description-display collapsed" data-card-index="${index}">${displayDescription}</div>
        <button class="description-toggle" data-card-index="${index}" style="display: none;">...</button>
      </div>
    ` : '';

    commentElement.innerHTML = `
      <!-- Comment Header -->
      <div class="comment-header">
        <input type="checkbox" class="comment-checkbox" data-comment-index="${index}" ${selectedComments.has(index) ? 'checked' : ''}>
        <div class="tags-container">
          ${tagsHTML}
        </div>
        <div style="flex: 1"></div>
        <div class="reorder-buttons">
          <button class="reorder-btn move-up-btn" data-index="${index}" ${index === 0 ? 'disabled' : ''} title="Move up">∧</button>
          <button class="reorder-btn move-down-btn" data-index="${index}" ${index === comments.length - 1 ? 'disabled' : ''} title="Move down">∨</button>
        </div>
      </div>

      <!-- Card Body -->
      <div class="comment-body">
        <div class="card-title-row">
          <div class="card-title-display">${titleHTML}</div>
          ${copyLinkButton}
        </div>
        ${descriptionHTML}
      </div>

      <!-- Comment Footer -->
      <div class="comment-footer">
        <div class="comment-actions-inline">
          <button class="edit-comment-btn" data-index="${index}">✏️ Edit</button>
          <button class="duplicate-comment-btn" data-index="${index}">📑 Duplicate</button>
          <button class="delete-comment-btn" data-index="${index}" style="color: #dc3545;">🗑️ Delete</button>
        </div>

        <button class="tag-picker-toggle" data-comment-index="${index}">🏷️ Tags</button>
      </div>
    `;
    commentsList.appendChild(commentElement);

    // Add event listeners to comment element
    const checkbox = commentElement.querySelector('.comment-checkbox');
    checkbox.addEventListener('change', function() {
      const idx = parseInt(this.getAttribute('data-comment-index'));
      if (this.checked) {
        selectedComments.add(idx);
      } else {
        selectedComments.delete(idx);
      }
      updateDeselectAllButton();
    });

    // Edit button
    const editBtn = commentElement.querySelector('.edit-comment-btn');
    editBtn.addEventListener('click', function() {
      editComment(this, parseInt(this.getAttribute('data-index')));
    });

    // Duplicate button
    const duplicateBtn = commentElement.querySelector('.duplicate-comment-btn');
    duplicateBtn.addEventListener('click', function() {
      showDuplicateCardModal(parseInt(this.getAttribute('data-index')));
    });

    // Delete button
    const deleteBtn = commentElement.querySelector('.delete-comment-btn');
    deleteBtn.addEventListener('click', function() {
      deleteComment(parseInt(this.getAttribute('data-index')));
    });

    // Move up button
    const moveUpBtn = commentElement.querySelector('.move-up-btn');
    if (moveUpBtn) {
      moveUpBtn.addEventListener('click', function() {
        moveCommentUp(parseInt(this.getAttribute('data-index')));
      });
    }

    // Move down button
    const moveDownBtn = commentElement.querySelector('.move-down-btn');
    if (moveDownBtn) {
      moveDownBtn.addEventListener('click', function() {
        moveCommentDown(parseInt(this.getAttribute('data-index')));
      });
    }

    // Copy link button
    const copyLinkBtn = commentElement.querySelector('.copy-link-btn');
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', function() {
        const link = this.getAttribute('data-link');
        navigator.clipboard.writeText(link).then(function() {
          const originalText = copyLinkBtn.innerHTML;
          copyLinkBtn.innerHTML = '✓';
          setTimeout(function() {
            copyLinkBtn.innerHTML = originalText;
          }, 800);
        }, function(err) {
          console.error('Could not copy link: ', err);
          const originalText = copyLinkBtn.innerHTML;
          copyLinkBtn.innerHTML = '✗';
          setTimeout(function() {
            copyLinkBtn.innerHTML = originalText;
          }, 800);
        });
      });
    }

    // Description expand/collapse functionality
    const descriptionDiv = commentElement.querySelector('.card-description-display');
    const toggleBtn = commentElement.querySelector('.description-toggle');

    if (descriptionDiv && toggleBtn) {
      // Check if description overflows (more than 3 lines)
      // Wait for next tick to ensure element is rendered
      setTimeout(() => {
        const lineHeight = parseFloat(getComputedStyle(descriptionDiv).lineHeight);
        const maxHeight = lineHeight * 3; // 3 lines

        if (descriptionDiv.scrollHeight > maxHeight) {
          // Description is long enough to need toggle
          toggleBtn.style.display = 'inline-block';

          toggleBtn.addEventListener('click', function() {
            const isCollapsed = descriptionDiv.classList.contains('collapsed');

            if (isCollapsed) {
              descriptionDiv.classList.remove('collapsed');
              toggleBtn.textContent = 'Show less';
            } else {
              descriptionDiv.classList.add('collapsed');
              toggleBtn.textContent = '...';
            }
          });
        }
      }, 0);
    }
  });

  // Set up global tag picker event listeners
  setupGlobalTagPicker();

  // Update deselect all button visibility
  updateDeselectAllButton();
}

function buildTagPickerOptions(availableTags, selectedTagIds, commentIndex) {
  if (!availableTags || availableTags.length === 0) {
    return '<p style="padding: var(--space-md); text-align: center; color: var(--text-tertiary);">No tags available. Click "Manage Tags" to create some!</p>';
  }

  return availableTags.map(tag => {
    const isSelected = selectedTagIds.includes(tag.id);
    return `
      <div class="tag-option ${isSelected ? 'selected' : ''}" data-tag-id="${tag.id}" data-comment-index="${commentIndex}">
        <input type="checkbox" class="tag-option-checkbox" ${isSelected ? 'checked' : ''}>
        <span class="tag-swatch" style="background-color: ${tag.color};"></span>
        <span class="tag-option-name">${tag.name}</span>
      </div>
    `;
  }).join('');
}

// Setup global tag picker dropdown
let globalTagPickerActive = false;
let globalListenersInitialized = false;

function setupGlobalTagPicker() {
  const globalPicker = document.getElementById('global-tag-picker');
  const toggleButtons = document.querySelectorAll('.tag-picker-toggle');

  // Remove old listeners by cloning (simple way to remove all event listeners)
  const newGlobalPicker = globalPicker.cloneNode(true);
  globalPicker.parentNode.replaceChild(newGlobalPicker, globalPicker);

  toggleButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const commentIndex = parseInt(this.getAttribute('data-comment-index'));
      openGlobalTagPicker(this, commentIndex);
    });
  });

  // Only initialize document-level listeners once
  if (!globalListenersInitialized) {
    // Close when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#global-tag-picker') && !e.target.closest('.tag-picker-toggle')) {
        closeGlobalTagPicker();
      }
    });

    // Close when scrolling (since position becomes misaligned)
    window.addEventListener('scroll', function() {
      if (globalTagPickerActive) {
        closeGlobalTagPicker();
      }
    });

    globalListenersInitialized = true;
  }
}

function openGlobalTagPicker(button, commentIndex) {
  if (currentCommentBankIndex === -1) return;

  const globalPicker = document.getElementById('global-tag-picker');

  // If clicking the same button that's already open, close it
  const currentCommentIndex = globalPicker.getAttribute('data-current-comment');
  if (globalTagPickerActive && currentCommentIndex == commentIndex) {
    closeGlobalTagPicker();
    return;
  }

  const commentBank = commentBanks[currentCommentBankIndex];
  const comment = commentBank.comments[commentIndex];

  // Store which comment this picker is for
  globalPicker.setAttribute('data-current-comment', commentIndex);

  // Build tag options HTML
  globalPicker.innerHTML = buildTagPickerOptions(commentBank.tags, comment.tags, commentIndex);

  // Position the dropdown - account for scroll position
  const buttonRect = button.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  const pickerHeight = 320; // Max height
  const spaceBelow = window.innerHeight - buttonRect.bottom;
  const spaceAbove = buttonRect.top;

  // Position it aligned with the button (accounting for scroll)
  globalPicker.style.left = (buttonRect.left + scrollLeft) + 'px';

  // Position above or below based on available space
  if (spaceBelow > pickerHeight || spaceBelow > spaceAbove) {
    // Open below
    globalPicker.style.top = (buttonRect.bottom + scrollTop + 4) + 'px';
    globalPicker.style.bottom = 'auto';
  } else {
    // Open above
    globalPicker.style.top = (buttonRect.top + scrollTop - pickerHeight - 4) + 'px';
    globalPicker.style.bottom = 'auto';
  }

  // Show the dropdown
  globalPicker.style.display = 'block';
  globalTagPickerActive = true;

  // Setup listeners for tag options
  const tagOptions = globalPicker.querySelectorAll('.tag-option');
  tagOptions.forEach(option => {
    option.addEventListener('click', function(e) {
      e.stopPropagation();
      const checkbox = this.querySelector('.tag-option-checkbox');
      const tagId = this.getAttribute('data-tag-id');
      const index = parseInt(this.getAttribute('data-comment-index'));

      checkbox.checked = !checkbox.checked;
      toggleCommentTag(index, tagId);
      this.classList.toggle('selected');
    });

    // Prevent checkbox click from double-toggling
    const checkbox = option.querySelector('.tag-option-checkbox');
    checkbox.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });
}

function closeGlobalTagPicker() {
  const globalPicker = document.getElementById('global-tag-picker');
  globalPicker.style.display = 'none';
  globalPicker.removeAttribute('data-current-comment');
  globalTagPickerActive = false;
}

function toggleCommentTag(commentIndex, tagId) {
  if (currentCommentBankIndex === -1) return;
  const commentBank = commentBanks[currentCommentBankIndex];
  const comment = commentBank.comments[commentIndex];

  if (!comment.tags) {
    comment.tags = [];
  }

  const tagIndex = comment.tags.indexOf(tagId);
  if (tagIndex > -1) {
    comment.tags.splice(tagIndex, 1);
  } else {
    comment.tags.push(tagId);
  }

  saveData();
  // Update just the tags display without re-rendering entire list
  const commentElement = document.querySelectorAll('.comment')[commentIndex];
  const tagsContainer = commentElement.querySelector('.tags-container');

  const commentTags = comment.tags.map(tid => {
    return commentBank.tags.find(t => t.id === tid);
  }).filter(t => t);

  const tagsHTML = commentTags.length > 0
    ? commentTags.map(tag => `
        <span class="tag" style="background-color: ${tag.color}20; color: ${tag.color}; border-color: ${tag.color};">
          ${tag.name}
        </span>
      `).join('')
    : '<span class="tag" style="background-color: #f5f5f5; color: #999; border-color: #ddd;">No tags</span>';

  tagsContainer.innerHTML = tagsHTML;

  // Update accent color
  const accentColor = commentTags.length > 0 ? commentTags[0].color : '#888';
  commentElement.style.setProperty('--comment-accent-color', accentColor);
}

// Legacy functions removed - now using tag system

function clearData() {
  chrome.storage.local.remove(['commentBankData'], () => {
    // Reset to just the Sample Comment Bank
    commentBanks = getPreloadedCommentBanks();
    saveData();
    updateCommentBankList();
    hideClearDataPopup();
  });
}

function downloadCommentBank() {
  // Show the download popup with checkboxes for each comment bank
  const downloadOptions = document.getElementById('download-options');
  downloadOptions.innerHTML = '';

  commentBanks.forEach((commentBank, index) => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `comment-bank-${index}`;
    checkbox.name = 'comment-bank';
    checkbox.value = index;

    const label = document.createElement('label');
    label.htmlFor = `comment-bank-${index}`;
    label.textContent = commentBank.assignmentName;

    const option = document.createElement('div');
    option.className = 'download-option';
    option.appendChild(checkbox);
    option.appendChild(label);

    // Make the entire div clickable to toggle checkbox
    option.addEventListener('click', function(e) {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
      }
      option.classList.toggle('selected', checkbox.checked);
    });

    // Also handle direct checkbox clicks
    checkbox.addEventListener('change', function() {
      option.classList.toggle('selected', checkbox.checked);
    });

    downloadOptions.appendChild(option);
  });

  document.getElementById('download-popup').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}


function downloadSelectedCommentBank() {
  // Get all selected comment banks and initiate downloads
  const selectedCheckboxes = document.querySelectorAll('input[name="comment-bank"]:checked');

  if (selectedCheckboxes.length === 0) {
    alert('Please select at least one drawer to download.');
    return;
  }

  // Download each selected drawer
  selectedCheckboxes.forEach((checkbox, index) => {
    const selectedCommentBankIndex = checkbox.value;
    const selectedCommentBank = commentBanks[selectedCommentBankIndex];
    const commentBankData = JSON.stringify(selectedCommentBank, null, 2);
    const blob = new Blob([commentBankData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedCommentBank.assignmentName}.drawer`;
    document.body.appendChild(link);

    // Delay each download slightly to avoid browser blocking multiple downloads
    setTimeout(() => {
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, index * 100);
  });

  hideDownloadPopup();
}



function hideAllPopups() {
  document.getElementById('popup').style.display = 'none';
  document.getElementById('clear-data-popup').style.display = 'none';
  document.getElementById('delete-popup').style.display = 'none';
  document.getElementById('confirm-delete-popup').style.display = 'none';
  document.getElementById('download-popup').style.display = 'none';
  document.getElementById('upload-popup').style.display = 'none';
  document.getElementById('archive-confirm-popup').style.display = 'none';
  document.getElementById('about-popup').style.display = 'none';
  document.getElementById('duplicate-card-popup').style.display = 'none';
  document.getElementById('add-comment-popup').style.display = 'none';
  document.getElementById('tag-manager-popup').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';

  // Close options dropdown if open
  const dropdown = document.getElementById('optionsDropdownMenu');
  if (dropdown && dropdown.classList.contains('show')) {
    dropdown.classList.remove('show');
  }
}

function showAddCommentPopup() {
  document.getElementById('add-comment-popup').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
  document.getElementById('comment-text').focus();
}

function hideAddCommentPopup() {
  document.getElementById('add-comment-popup').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
}

// Tag Management Functions
function showTagManager() {
  displayTagList();
  document.getElementById('tag-manager-popup').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}

function hideTagManager() {
  document.getElementById('tag-manager-popup').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
}

function displayTagList() {
  if (currentCommentBankIndex === -1) return;
  const commentBank = commentBanks[currentCommentBankIndex];
  const tagList = document.getElementById('tag-list');

  if (!commentBank.tags || commentBank.tags.length === 0) {
    tagList.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: var(--space-xl);">No tags yet. Create your first tag below!</p>';
    return;
  }

  tagList.innerHTML = commentBank.tags.map(tag => `
    <div class="tag-list-item">
      <span class="tag" style="background-color: ${tag.color}20; color: ${tag.color}; border-color: ${tag.color};">
        ${tag.name}
      </span>
      <div class="tag-list-actions">
        <button class="delete-tag-btn" data-tag-id="${tag.id}" style="background: #dc3545; color: white;">Delete</button>
      </div>
    </div>
  `).join('');

  // Add event listeners to delete tag buttons
  tagList.querySelectorAll('.delete-tag-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      deleteTag(this.getAttribute('data-tag-id'));
    });
  });
}

function addNewTag() {
  if (currentCommentBankIndex === -1) return;
  const commentBank = commentBanks[currentCommentBankIndex];
  const tagName = document.getElementById('new-tag-name').value.trim();
  const tagColor = document.getElementById('new-tag-color').value;

  if (!tagName) {
    alert('Please enter a tag name');
    return;
  }

  if (!commentBank.tags) {
    commentBank.tags = [];
  }

  commentBank.tags.push({
    id: generateId(),
    name: tagName,
    color: tagColor
  });

  saveData();
  displayTagList();
  displayTagFilterBar(); // Update the filter bar with the new tag
  document.getElementById('new-tag-name').value = '';
  document.getElementById('new-tag-color').value = '#6b2d8f';
}

function deleteTag(tagId) {
  if (currentCommentBankIndex === -1) return;
  const commentBank = commentBanks[currentCommentBankIndex];

  if (!confirm('Delete this tag? It will be removed from all comments.')) {
    return;
  }

  // Remove tag from all comments
  commentBank.comments.forEach(comment => {
    if (comment.tags) {
      comment.tags = comment.tags.filter(id => id !== tagId);
    }
  });

  // Remove tag from comment bank
  commentBank.tags = commentBank.tags.filter(tag => tag.id !== tagId);

  // Remove from active filters if it was active
  activeTagFilters = activeTagFilters.filter(id => id !== tagId);

  saveData();
  displayTagList();
  displayTagFilterBar(); // Update the filter bar
  displayComments(commentBank.comments);
}

function uploadSelectedCommentBank() {
  // Get all selected files and upload them
  const uploadInput = document.getElementById('upload-input');
  const files = uploadInput.files;

  if (files.length === 0) {
    alert('Please select at least one file to upload.');
    return;
  }

  let uploadedCount = 0;
  const totalFiles = files.length;

  // Process each file
  Array.from(files).forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const commentBankData = JSON.parse(e.target.result);
        commentBanks.push(commentBankData);
        uploadedCount++;

        // After all files are processed, update UI
        if (uploadedCount === totalFiles) {
          saveData();
          updateCommentBankList();
          hideUploadPopup();
        }
      } catch (error) {
        console.error(`Error parsing file ${file.name}:`, error);
        alert(`Error uploading ${file.name}. Make sure it's a valid .drawer file.`);
      }
    };
    reader.readAsText(file);
  });
}

function saveComment() {
  const cardTitle = document.getElementById('card-title').value.trim();
  const cardLink = document.getElementById('card-link').value.trim();
  const cardDescription = document.getElementById('card-description').value.trim();
  const commentIndex = document.getElementById('add-comment-popup').getAttribute('data-index');

  if (!cardTitle) {
    alert('Please enter a card title');
    return;
  }

  if (currentCommentBankIndex === -1) return;
  const currentCommentBank = commentBanks[currentCommentBankIndex];

  // Get selected tags from modal
  const selectedTags = getSelectedModalTags();

  if (commentIndex) {
    // Editing existing card
    currentCommentBank.comments[commentIndex].title = cardTitle;
    currentCommentBank.comments[commentIndex].link = cardLink;
    currentCommentBank.comments[commentIndex].description = cardDescription;
    currentCommentBank.comments[commentIndex].tags = selectedTags;
  } else {
    // Adding new card
    currentCommentBank.comments.push({
      title: cardTitle,
      link: cardLink,
      description: cardDescription,
      tags: [...selectedTags]
    });
  }

  saveData();
  displayComments(currentCommentBank.comments);
  hideAddCommentPopup();
  document.getElementById('card-title').value = '';
  document.getElementById('card-link').value = '';
  document.getElementById('card-description').value = '';
  document.getElementById('add-comment-popup').removeAttribute('data-index');
}

// Populate modal with tags
function populateModalTags(selectedTagIds = []) {
  if (currentCommentBankIndex === -1) return;
  const commentBank = commentBanks[currentCommentBankIndex];
  const container = document.getElementById('modal-tags-container');

  if (!commentBank.tags || commentBank.tags.length === 0) {
    container.innerHTML = '<span class="no-tags-message">No tags available. Create tags in "Manage Tags".</span>';
    return;
  }

  container.innerHTML = commentBank.tags.map(tag => `
    <span class="modal-tag ${selectedTagIds.includes(tag.id) ? 'selected' : ''}"
          data-tag-id="${tag.id}"
          style="background-color: ${tag.color}20; color: ${tag.color}; border-color: ${tag.color};">
      ${tag.name}
    </span>
  `).join('');

  // Add click handlers
  container.querySelectorAll('.modal-tag').forEach(tagEl => {
    tagEl.addEventListener('click', function() {
      this.classList.toggle('selected');
    });
  });
}

// Get selected tags from modal
function getSelectedModalTags() {
  const container = document.getElementById('modal-tags-container');
  const selectedTags = [];
  container.querySelectorAll('.modal-tag.selected').forEach(tagEl => {
    selectedTags.push(tagEl.getAttribute('data-tag-id'));
  });
  return selectedTags;
}

function moveCommentUp(index) {
  if (currentCommentBankIndex === -1) return;
  const currentCommentBank = commentBanks[currentCommentBankIndex];
  if (index > 0) {
    const temp = currentCommentBank.comments[index];
    currentCommentBank.comments[index] = currentCommentBank.comments[index - 1];
    currentCommentBank.comments[index - 1] = temp;

    // Update selectedComments: swap the indices if either is selected
    const wasCurrentSelected = selectedComments.has(index);
    const wasPreviousSelected = selectedComments.has(index - 1);

    if (wasCurrentSelected) {
      selectedComments.delete(index);
      selectedComments.add(index - 1);
    }
    if (wasPreviousSelected) {
      selectedComments.delete(index - 1);
      selectedComments.add(index);
    }

    saveData();
    displayComments(currentCommentBank.comments);
  }
}

function moveCommentDown(index) {
  if (currentCommentBankIndex === -1) return;
  const currentCommentBank = commentBanks[currentCommentBankIndex];
  if (index < currentCommentBank.comments.length - 1) {
    const temp = currentCommentBank.comments[index];
    currentCommentBank.comments[index] = currentCommentBank.comments[index + 1];
    currentCommentBank.comments[index + 1] = temp;

    // Update selectedComments: swap the indices if either is selected
    const wasCurrentSelected = selectedComments.has(index);
    const wasNextSelected = selectedComments.has(index + 1);

    if (wasCurrentSelected) {
      selectedComments.delete(index);
      selectedComments.add(index + 1);
    }
    if (wasNextSelected) {
      selectedComments.delete(index + 1);
      selectedComments.add(index);
    }

    saveData();
    displayComments(currentCommentBank.comments);
  }
}

setInterval(saveData, 3000);
window.addEventListener('load', loadData);

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
  const hash = window.location.hash.substring(1);
  if (hash) {
    // Find and open the comment bank (without updating history again)
    const index = commentBanks.findIndex(bank => slugify(bank.assignmentName) === hash);
    if (index !== -1 && index !== currentCommentBankIndex) {
      openCommentBank(index, false);
    }
  } else {
    // No hash means we should go home
    if (currentCommentBankIndex !== -1) {
      goToHome();
    }
  }
});

// Options Dropdown Toggle
function toggleOptionsDropdown() {
  const dropdown = document.getElementById('optionsDropdownMenu');
  dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
window.addEventListener('click', function(event) {
  if (!event.target.matches('.about-btn') && !event.target.matches('#optionsDropdownBtn')) {
    const dropdowns = document.getElementsByClassName('options-dropdown-menu');
    for (let i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
});

// Show About function
function showAbout() {
  document.getElementById('about-popup').style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
  toggleOptionsDropdown();
}

function hideAboutPopup() {
  document.getElementById('about-popup').style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
}
