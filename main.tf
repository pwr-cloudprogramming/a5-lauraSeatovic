terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.1"
    }
  }
  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-east-1"
}
# Define VPC
resource "aws_vpc" "my_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "my-vpc"
  }
}

# Define Internet Gateway
resource "aws_internet_gateway" "my_igw" {
  vpc_id = aws_vpc.my_vpc.id

  tags = {
    Name = "my-igw"
  }
}

# Define Public Subnet
resource "aws_subnet" "public_subnet" {
  vpc_id            = aws_vpc.my_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  tags = {
    Name = "public-subnet"
  }
}

# Define Security Group
resource "aws_security_group" "my_security_group" {
  name        = "my-security-group"
  description = "Security group for Tic Tac Toe game"

  vpc_id = aws_vpc.my_vpc.id


    ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8081
    to_port     = 8081
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Define egress rules
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "my-security-group"
  }
}



# Define ECR Repository
resource "aws_ecr_repository" "my_repository_back" {
  name = "339713018133.dkr.ecr.us-east-1.amazonaws.com/tic_tac_toe_back"
}

resource "aws_ecr_repository" "my_repository_front" {
  name = "339713018133.dkr.ecr.us-east-1.amazonaws.com/tic_tac_toe_front"
}


# Define EC2 Instance
resource "aws_instance" "tic_tac_toe_instance" {
  ami           = "ami-080e1f13689e07408"
  instance_type = "t2.micro"
  key_name      = "vockey"
  subnet_id     = aws_subnet.public_subnet.id
  associate_public_ip_address = "true"
  vpc_security_group_ids = [aws_security_group.my_security_group.id]

  user_data = <<-EOF
              # Additional setup for your Tic Tac Toe game
              docker pull ${aws_ecr_repository.my_repository_back.name}:v1
              docker pull ${aws_ecr_repository.my_repository_front.name}:v1
              docker run -d -p 8081:3000 ${aws_ecr_repository.my_repository_front.name}:v1
              docker run -d -p 8080:8080 ${aws_ecr_repository.my_repository_back.name}:v1
              EOF
  tags = {
    Name = "tic-tac-toe-instance" # Change this to a meaningful name for your instance
  }
}
