const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EmailStorage", function () {
  let emailStorage;
  let owner;
  let recipient;
  
  // Deploy a new contract before each test
  beforeEach(async function () {
    [owner, recipient, ...others] = await ethers.getSigners();
    
    // Deploy the contract
    const EmailStorage = await ethers.getContractFactory("EmailStorage");
    emailStorage = await EmailStorage.deploy();
    await emailStorage.waitForDeployment();
  });
  
  describe("Sending emails", function () {
    it("Should allow users to send emails", async function () {
      const ipfsHash = "QmT17Rq1ar5RqGBcHhRpd8KeEKNjKqxMVcQGQNkfWRdPq5";
      
      // Send an email
      const tx = await emailStorage.connect(owner).sendEmail(recipient.address, ipfsHash);
      const receipt = await tx.wait();
      
      // Get the email ID from the event
      const event = receipt.logs.find(x => x.fragment && x.fragment.name === "EmailSent");
      const emailId = event.args[0]; // First argument is emailId
      
      // Get the email and verify its data
      const email = await emailStorage.getEmail(emailId);
      
      expect(email[0]).to.equal(owner.address); // Sender
      expect(email[1]).to.equal(recipient.address); // Recipient
      expect(email[2]).to.equal(ipfsHash); // IPFS hash
      expect(email[4]).to.equal(false); // isRead
      expect(email[5]).to.equal(false); // isStarred
      expect(email[6]).to.equal(false); // isDraft
    });
    
    it("Should not allow sending emails to zero address", async function () {
      const ipfsHash = "QmT17Rq1ar5RqGBcHhRpd8KeEKNjKqxMVcQGQNkfWRdPq5";
      
      // Try to send an email to the zero address
      await expect(
        emailStorage.connect(owner).sendEmail(ethers.ZeroAddress, ipfsHash)
      ).to.be.revertedWith("Invalid recipient address");
    });
  });
  
  describe("Saving drafts", function () {
    it("Should allow users to save drafts", async function () {
      const ipfsHash = "QmT17Rq1ar5RqGBcHhRpd8KeEKNjKqxMVcQGQNkfWRdPq5";
      
      // Save a draft
      const tx = await emailStorage.connect(owner).saveDraft(recipient.address, ipfsHash);
      const receipt = await tx.wait();
      
      // Get the email ID from the event
      const event = receipt.logs.find(x => x.fragment && x.fragment.name === "EmailSent");
      const emailId = event.args[0]; // First argument is emailId
      
      // Get the email and verify its data
      const email = await emailStorage.getEmail(emailId);
      
      expect(email[0]).to.equal(owner.address); // Sender
      expect(email[1]).to.equal(recipient.address); // Recipient
      expect(email[2]).to.equal(ipfsHash); // IPFS hash
      expect(email[6]).to.equal(true); // isDraft
    });
  });
  
  describe("Updating email status", function () {
    it("Should allow sender to update email status", async function () {
      const ipfsHash = "QmT17Rq1ar5RqGBcHhRpd8KeEKNjKqxMVcQGQNkfWRdPq5";
      
      // Send an email
      const tx = await emailStorage.connect(owner).sendEmail(recipient.address, ipfsHash);
      const receipt = await tx.wait();
      
      // Get the email ID from the event
      const event = receipt.logs.find(x => x.fragment && x.fragment.name === "EmailSent");
      const emailId = event.args[0];
      
      // Update the email status
      await emailStorage.connect(owner).updateEmailStatus(emailId, true, true, false);
      
      // Get the email and verify its updated status
      const email = await emailStorage.getEmail(emailId);
      
      expect(email[4]).to.equal(true); // isRead
      expect(email[5]).to.equal(true); // isStarred
      expect(email[6]).to.equal(false); // isDraft
    });
    
    it("Should allow recipient to update email status", async function () {
      const ipfsHash = "QmT17Rq1ar5RqGBcHhRpd8KeEKNjKqxMVcQGQNkfWRdPq5";
      
      // Send an email
      const tx = await emailStorage.connect(owner).sendEmail(recipient.address, ipfsHash);
      const receipt = await tx.wait();
      
      // Get the email ID from the event
      const event = receipt.logs.find(x => x.fragment && x.fragment.name === "EmailSent");
      const emailId = event.args[0];
      
      // Update the email status as recipient
      await emailStorage.connect(recipient).updateEmailStatus(emailId, true, true, false);
      
      // Get the email and verify its updated status
      const email = await emailStorage.getEmail(emailId);
      
      expect(email[4]).to.equal(true); // isRead
      expect(email[5]).to.equal(true); // isStarred
      expect(email[6]).to.equal(false); // isDraft
    });
    
    it("Should not allow non-sender/recipient to update email status", async function () {
      const ipfsHash = "QmT17Rq1ar5RqGBcHhRpd8KeEKNjKqxMVcQGQNkfWRdPq5";
      const [_, __, thirdParty] = await ethers.getSigners();
      
      // Send an email
      const tx = await emailStorage.connect(owner).sendEmail(recipient.address, ipfsHash);
      const receipt = await tx.wait();
      
      // Get the email ID from the event
      const event = receipt.logs.find(x => x.fragment && x.fragment.name === "EmailSent");
      const emailId = event.args[0];
      
      // Try to update the email status as third party
      await expect(
        emailStorage.connect(thirdParty).updateEmailStatus(emailId, true, true, false)
      ).to.be.revertedWith("Not authorized");
    });
  });
  
  describe("Getting emails", function () {
    it("Should allow users to get their emails", async function () {
      const ipfsHash1 = "QmT17Rq1ar5RqGBcHhRpd8KeEKNjKqxMVcQGQNkfWRdPq5";
      const ipfsHash2 = "QmT17Rq1ar5RqGBcHhRpd8KeEKNjKqxMVcQGQNkfWRdPq6";
      
      // Send emails
      await emailStorage.connect(owner).sendEmail(recipient.address, ipfsHash1);
      await emailStorage.connect(recipient).sendEmail(owner.address, ipfsHash2);
      
      // Get user's emails
      const ownerEmails = await emailStorage.getUserEmails(owner.address);
      const recipientEmails = await emailStorage.getUserEmails(recipient.address);
      
      expect(ownerEmails.length).to.equal(2); // One sent, one received
      expect(recipientEmails.length).to.equal(2); // One sent, one received
    });
  });
}); 