
pragma solidity ^0.8.19;


contract Voting {
    //  STRUCTS 
    
    struct Candidate {
        uint256 id;
        string name;
        string party;
        string imageUrl;
        uint256 voteCount;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
        uint256 registrationTime;
    }

     
    
    address public admin;
    string public electionName;
    string public electionDescription;
    
    uint256 public candidateCount;
    uint256 public voterCount;
    uint256 public totalVotes;
    
    uint256 public votingStartTime;
    uint256 public votingEndTime;
    
    bool public votingStarted;
    bool public votingEnded;

    
    
    mapping(uint256 => Candidate) public candidates;
    mapping(address => Voter) public voters;
    
  
    uint256[] public candidateIds;

    //EVENTSsss
    
    event CandidateAdded(uint256 indexed candidateId, string name, string party);
    event VoterRegistered(address indexed voterAddress);
    event VoteCasted(address indexed voter, uint256 indexed candidateId);
    event VotingStarted(uint256 startTime, uint256 endTime);
    event VotingEnded(uint256 endTime);
    event ElectionReset();

    //  MODIFIERS 
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Sadece admin bu islemi yapabilir");
        _;
    }

    modifier votingActive() {
        require(votingStarted && !votingEnded, "Oylama aktif degil");
        require(block.timestamp >= votingStartTime, "Oylama henuz baslamadi");
        require(block.timestamp <= votingEndTime, "Oylama suresi doldu");
        _;
    }

    modifier votingNotStarted() {
        require(!votingStarted, "Oylama zaten basladi");
        _;
    }

    //  CONSTRUCTOR 
    
    constructor(string memory _electionName, string memory _electionDescription) {
        admin = msg.sender;
        electionName = _electionName;
        electionDescription = _electionDescription;
        candidateCount = 0;
        voterCount = 0;
        totalVotes = 0;
        votingStarted = false;
        votingEnded = false;
    }

    // ADMIN FUNCTIONS
    
    /**
     * @dev Add a new candidate
     * @param _name Candidate's name
     * @param _party Candidate's party
     * @param _imageUrl Candidate's image URL
     */
    function addCandidate(
        string memory _name,
        string memory _party,
        string memory _imageUrl
    ) public onlyAdmin votingNotStarted {
        candidateCount++;
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            party: _party,
            imageUrl: _imageUrl,
            voteCount: 0
        });
        candidateIds.push(candidateCount);
        
        emit CandidateAdded(candidateCount, _name, _party);
    }

    /**
     * @dev Start the voting process
     * @param _durationInMinutes Duration of voting in minutes
     */
    function startVoting(uint256 _durationInMinutes) public onlyAdmin votingNotStarted {
        require(candidateCount >= 2, "En az 2 aday olmali");
        
        votingStartTime = block.timestamp;
        votingEndTime = block.timestamp + (_durationInMinutes * 1 minutes);
        votingStarted = true;
        votingEnded = false;
        
        emit VotingStarted(votingStartTime, votingEndTime);
    }

    /**
     * @dev End the voting process manually
     */
    function endVoting() public onlyAdmin {
        require(votingStarted, "Oylama baslamadi");
        require(!votingEnded, "Oylama zaten bitti");
        
        votingEnded = true;
        votingEndTime = block.timestamp;
        
        emit VotingEnded(votingEndTime);
    }

    /**
     * @dev Reset election for a new round
     */
    function resetElection(
        string memory _newElectionName,
        string memory _newDescription
    ) public onlyAdmin {
        require(votingEnded || !votingStarted, "Aktif oylama sifirlanamiyor");
        
        electionName = _newElectionName;
        electionDescription = _newDescription;
        
        // Reset candidates
        for (uint256 i = 0; i < candidateIds.length; i++) {
            delete candidates[candidateIds[i]];
        }
        delete candidateIds;
        
        candidateCount = 0;
        voterCount = 0;
        totalVotes = 0;
        votingStarted = false;
        votingEnded = false;
        
        emit ElectionReset();
    }

    // VOTER FUNCTIONS 
    
    /**
     * @dev Register as a voter
     */
    function registerVoter() public {
        require(!voters[msg.sender].isRegistered, "Zaten kayitlisiniz");
        
        voters[msg.sender] = Voter({
            isRegistered: true,
            hasVoted: false,
            votedCandidateId: 0,
            registrationTime: block.timestamp
        });
        voterCount++;
        
        emit VoterRegistered(msg.sender);
    }

    /**
     * @dev Cast a vote for a candidate
     * @param _candidateId ID of the candidate to vote for
     */
    function vote(uint256 _candidateId) public votingActive {
        require(voters[msg.sender].isRegistered, "Kayitli degilsiniz");
        require(!voters[msg.sender].hasVoted, "Zaten oy kullandiniz");
        require(_candidateId > 0 && _candidateId <= candidateCount, "Gecersiz aday ID");

        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedCandidateId = _candidateId;
        candidates[_candidateId].voteCount++;
        totalVotes++;

        emit VoteCasted(msg.sender, _candidateId);
    }

    //  VIEW FUNCTIONS 
    
    /**
     * @dev Get candidate details
     */
    function getCandidate(uint256 _candidateId) public view returns (
        uint256 id,
        string memory name,
        string memory party,
        string memory imageUrl,
        uint256 voteCount
    ) {
        require(_candidateId > 0 && _candidateId <= candidateCount, "Gecersiz aday ID");
        Candidate memory candidate = candidates[_candidateId];
        return (
            candidate.id,
            candidate.name,
            candidate.party,
            candidate.imageUrl,
            candidate.voteCount
        );
    }

    /**
     * @dev Get all candidates
     */
    function getAllCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](candidateCount);
        for (uint256 i = 0; i < candidateCount; i++) {
            allCandidates[i] = candidates[candidateIds[i]];
        }
        return allCandidates;
    }

    /**
     * @dev Get voter status
     */
    function getVoterStatus(address _voter) public view returns (
        bool isRegistered,
        bool hasVoted,
        uint256 votedCandidateId
    ) {
        Voter memory voter = voters[_voter];
        return (voter.isRegistered, voter.hasVoted, voter.votedCandidateId);
    }

    /**
     * @dev Get election status
     */
    function getElectionStatus() public view returns (
        string memory name,
        string memory description,
        uint256 candidates_count,
        uint256 voters_count,
        uint256 total_votes,
        bool started,
        bool ended,
        uint256 startTime,
        uint256 endTime
    ) {
        return (
            electionName,
            electionDescription,
            candidateCount,
            voterCount,
            totalVotes,
            votingStarted,
            votingEnded,
            votingStartTime,
            votingEndTime
        );
    }

    /**
     * @dev Get remaining time for voting
     */
    function getRemainingTime() public view returns (uint256) {
        if (!votingStarted || votingEnded) {
            return 0;
        }
        if (block.timestamp >= votingEndTime) {
            return 0;
        }
        return votingEndTime - block.timestamp;
    }

    /**
     * @dev Get the winning candidate
     */
    function getWinner() public view returns (
        uint256 winnerId,
        string memory winnerName,
        uint256 winnerVoteCount
    ) {
        require(votingEnded || block.timestamp > votingEndTime, "Oylama henuz bitmedi");
        
        uint256 maxVotes = 0;
        uint256 winningId = 0;
        
        for (uint256 i = 0; i < candidateIds.length; i++) {
            if (candidates[candidateIds[i]].voteCount > maxVotes) {
                maxVotes = candidates[candidateIds[i]].voteCount;
                winningId = candidateIds[i];
            }
        }
        
        return (winningId, candidates[winningId].name, maxVotes);
    }

    /**
     * @dev Check if voting is currently active
     */
    function isVotingActive() public view returns (bool) {
        return votingStarted && 
               !votingEnded && 
               block.timestamp >= votingStartTime && 
               block.timestamp <= votingEndTime;
    }
}
